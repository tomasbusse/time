import { mutation, query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Helper to generate next invoice number
async function generateInvoiceNumber(ctx: any, workspaceId: any) {
    const settings = await ctx.db
        .query("companySettings")
        .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
        .first();

    const prefix = settings?.invoicePrefix || "RE-";
    const nextNum = settings?.nextInvoiceNumber || 1000;

    // Update settings with next number
    if (settings) {
        await ctx.db.patch(settings._id, {
            nextInvoiceNumber: nextNum + 1,
            updatedAt: Date.now(),
        });
    } else {
        // Create default settings if missing
        await ctx.db.insert("companySettings", {
            workspaceId,
            companyName: "My Company",
            ownerName: "Me",
            addressLine1: "Street 1",
            zipCode: "12345",
            city: "City",
            country: "Germany",
            invoicePrefix: prefix,
            nextInvoiceNumber: nextNum + 1,
            defaultPaymentTermsDays: 14,
            defaultTaxRate: 19,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    return `${prefix}${nextNum}`;
}

// Create a new invoice
export const createInvoice = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        customerId: v.id("customers"),
        date: v.number(),
        dueDate: v.number(),
        items: v.array(v.object({
            productId: v.optional(v.id("products")),
            description: v.string(),
            quantity: v.number(),
            unit: v.string(),
            unitPrice: v.number(),
            taxRate: v.number(),
            serviceDate: v.optional(v.string()),
            startTime: v.optional(v.string()),
            endTime: v.optional(v.string()),
            calendarEventId: v.optional(v.string()),
        })),
        notes: v.optional(v.string()),
        paymentTerms: v.optional(v.string()),
        relatedCalendarEvents: v.optional(v.array(v.string())),
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("sent"),
            v.literal("paid"),
            v.literal("cancelled"),
            v.literal("archived")
        )),
        manualInvoiceNumber: v.optional(v.string()), // For migration from old system
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        // Get user if authenticated, otherwise use a placeholder for development
        let userId = null;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identity.email!))
                .unique();
            userId = user?._id || null;
        }

        let invoiceNumber: string;

        // Handle manual invoice number (for migration)
        if (args.manualInvoiceNumber) {
            // Check if invoice number already exists
            const existing = await ctx.db
                .query("invoices")
                .withIndex("by_number", (q) => q.eq("invoiceNumber", args.manualInvoiceNumber!))
                .first();

            if (existing) {
                throw new Error(`Invoice number ${args.manualInvoiceNumber} already exists`);
            }

            invoiceNumber = args.manualInvoiceNumber;

            // Extract sequential number from format YY/MM/XXXX and update nextInvoiceNumber if higher
            // Format example: 25/09/5060
            const match = args.manualInvoiceNumber.match(/\/(\d+)$/);
            if (match) {
                const sequentialNumber = parseInt(match[1], 10);

                const settings = await ctx.db
                    .query("companySettings")
                    .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
                    .first();

                if (settings && sequentialNumber >= (settings.nextInvoiceNumber || 0)) {
                    await ctx.db.patch(settings._id, {
                        nextInvoiceNumber: sequentialNumber + 1,
                        updatedAt: Date.now(),
                    });
                }
            }
        } else {
            // Auto-generate invoice number in YY/MM/XXXX format
            const settings = await ctx.db
                .query("companySettings")
                .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
                .first();

            if (!settings) {
                // Create default settings if missing
                await ctx.db.insert("companySettings", {
                    workspaceId: args.workspaceId,
                    companyName: "My Company",
                    ownerName: "Me",
                    addressLine1: "Street 1",
                    zipCode: "12345",
                    city: "City",
                    country: "Germany",
                    invoicePrefix: "",
                    nextInvoiceNumber: 1000,
                    defaultPaymentTermsDays: 14,
                    defaultTaxRate: 19,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }

            const nextNum = settings?.nextInvoiceNumber || 1000;
            const invoiceDate = new Date(args.date);
            const year = invoiceDate.getFullYear().toString().slice(-2); // YY
            const month = (invoiceDate.getMonth() + 1).toString().padStart(2, '0'); // MM

            invoiceNumber = `${year}/${month}/${nextNum}`;

            // Update settings with next number
            if (settings) {
                await ctx.db.patch(settings._id, {
                    nextInvoiceNumber: nextNum + 1,
                    updatedAt: Date.now(),
                });
            }
        }

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;

        args.items.forEach(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTax = lineTotal * (item.taxRate / 100);
            subtotal += lineTotal;
            taxTotal += lineTax;
        });

        const total = subtotal + taxTotal;

        const invoiceId = await ctx.db.insert("invoices", {
            workspaceId: args.workspaceId,
            customerId: args.customerId,
            invoiceNumber,
            date: args.date,
            dueDate: args.dueDate,
            status: args.status || "draft",
            subtotal,
            taxTotal,
            total,
            notes: args.notes,
            paymentTerms: args.paymentTerms,
            relatedCalendarEvents: args.relatedCalendarEvents,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Create items
        for (const item of args.items) {
            await ctx.db.insert("invoiceItems", {
                invoiceId,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                total: item.quantity * item.unitPrice,
                serviceDate: item.serviceDate,
                startTime: item.startTime,
                endTime: item.endTime,
                calendarEventId: item.calendarEventId,
            });
        }

        // Audit Log (only if user is authenticated)
        if (userId) {
            await ctx.db.insert("invoiceAuditLog", {
                workspaceId: args.workspaceId,
                invoiceId,
                userId: userId,
                action: "created",
                timestamp: Date.now(),
            });
        }

        return invoiceId;
    },
});

// Update invoice status (e.g. Draft -> Sent)
export const updateInvoiceStatus = mutation({
    args: {
        id: v.id("invoices"),
        status: v.union(
            v.literal("draft"),
            v.literal("sent"),
            v.literal("paid"),
            v.literal("cancelled"),
            v.literal("archived")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        // Get user if authenticated, otherwise use a placeholder for development
        let userId = null;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identity.email!))
                .unique();
            userId = user?._id || null;
        }

        const invoice = await ctx.db.get(args.id);
        if (!invoice) throw new Error("Invoice not found");

        const updates: any = {
            status: args.status,
            updatedAt: Date.now(),
        };

        if (args.status === "sent" && !invoice.sentAt) {
            updates.sentAt = Date.now();
        }
        if (args.status === "paid" && !invoice.paidAt) {
            updates.paidAt = Date.now();
        }

        await ctx.db.patch(args.id, updates);

        // Audit Log (only if user is authenticated)
        if (userId) {
            await ctx.db.insert("invoiceAuditLog", {
                workspaceId: invoice.workspaceId,
                invoiceId: args.id,
                userId: userId,
                action: `status_change_to_${args.status}`,
                timestamp: Date.now(),
            });
        }
    },
});

// List invoices
export const listInvoices = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .order("desc")
            .collect();

        // Enrich with customer names and numbers
        const enriched = await Promise.all(invoices.map(async (inv) => {
            const customer = await ctx.db.get(inv.customerId);
            return {
                ...inv,
                customerName: customer?.name || "Unknown",
                customerNumber: customer?.customerNumber || null
            };
        }));

        return enriched;
    },
});

// Get open invoices for dashboard (sent but not paid)
export const getOpenInvoices = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .filter((q) => q.eq(q.field("status"), "sent"))
            .order("desc")
            .take(5);

        // Enrich with customer names
        const enriched = await Promise.all(invoices.map(async (inv) => {
            const customer = await ctx.db.get(inv.customerId);
            return {
                ...inv,
                customerName: customer?.name || "Unknown",
                isOverdue: inv.dueDate < Date.now(),
            };
        }));

        return enriched;
    },
});

// Get draft invoices for dashboard
export const getDraftInvoices = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .filter((q) => q.eq(q.field("status"), "draft"))
            .order("desc")
            .take(5);

        // Enrich with customer names
        const enriched = await Promise.all(invoices.map(async (inv) => {
            const customer = await ctx.db.get(inv.customerId);
            return {
                ...inv,
                customerName: customer?.name || "Unknown",
            };
        }));

        return enriched;
    },
});

// Get full invoice details
export const getInvoice = query({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const invoice = await ctx.db.get(args.id);
        if (!invoice) return null;

        const customer = await ctx.db.get(invoice.customerId);
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
            .collect();

        return {
            ...invoice,
            customer,
            items,
        };
    },
});

// Action: Import from Calendar
export const importFromCalendar = action({
    args: {
        workspaceId: v.id("workspaces"),
        startDate: v.string(), // ISO string
        endDate: v.string(),   // ISO string
        accessToken: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<any[]> => {
        // 1. Call calendar.listEvents
        const events: any[] = await ctx.runAction(api.calendar.listEvents, {
            timeMin: args.startDate,
            timeMax: args.endDate,
            accessToken: args.accessToken,
        });

        // 2. Filter/Process events (optional: could be done in UI, but here we just return raw events)
        // The UI will handle the selection and mapping to invoice items.
        return events;
    },
});

// Action: Export CSV (DATEV)
export const exportCSV = action({
    args: {
        workspaceId: v.id("workspaces"),
        invoiceIds: v.array(v.id("invoices")),
    },
    handler: async (ctx, args) => {
        // Fetch invoices via query
        // Note: We can't directly query DB in action, so we might need a helper query or pass data
        // For simplicity, let's assume we pass IDs and fetch data via a helper query
        const invoicesData = await ctx.runQuery(api.invoices.getInvoicesForExport, { ids: args.invoiceIds });

        // Generate CSV content
        let csvContent = "";
        // DATEV Format specs (simplified):
        // Semicolon delimiter, ISO-8859-1 encoding (we'll return base64 of that)
        // Columns: Umsatz (Netto), Soll/Haben, Konto, Gegenkonto, Datum, Belegfeld1 (InvoiceNr), Buchungstext

        invoicesData.forEach((inv: any) => {
            const amount = (inv.total / 100).toFixed(2).replace(".", ","); // German format
            const date = new Date(inv.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\./g, ""); // DDMMYYYY
            const invoiceNr = inv.invoiceNumber;
            const customerName = inv.customerName;

            // Simple DATEV-like line
            // Umsatz;S/H;Konto;Gegenkonto;Datum;Belegfeld1;Buchungstext
            csvContent += `${amount};S;8400;10000;${date};${invoiceNr};${customerName}\r\n`;
        });

        // Encode to Base64 (simulating ISO-8859-1 by just keeping it simple for now, real DATEV needs strict encoding)
        const buffer = Buffer.from(csvContent, "latin1"); // latin1 is close to ISO-8859-1
        return buffer.toString("base64");
    },
});

// Helper query for export
export const getInvoicesForExport = query({
    args: { ids: v.array(v.id("invoices")) },
    handler: async (ctx, args) => {
        const invoices = [];
        for (const id of args.ids) {
            const inv = await ctx.db.get(id);
            if (inv) {
                const customer = await ctx.db.get(inv.customerId);
                invoices.push({ ...inv, customerName: customer?.name || "" });
            }
        }
        return invoices;
    },
});

// Update an existing invoice (only if draft)
export const updateInvoice = mutation({
    args: {
        id: v.id("invoices"),
        customerId: v.id("customers"),
        date: v.number(),
        dueDate: v.number(),
        items: v.array(v.object({
            productId: v.optional(v.id("products")),
            description: v.string(),
            quantity: v.number(),
            unit: v.string(),
            unitPrice: v.number(),
            taxRate: v.number(),
            serviceDate: v.optional(v.string()),
            startTime: v.optional(v.string()),
            endTime: v.optional(v.string()),
            calendarEventId: v.optional(v.string()),
        })),
        notes: v.optional(v.string()),
        paymentTerms: v.optional(v.string()),
        relatedCalendarEvents: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        // Get user if authenticated
        let userId = null;
        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", identity.email!))
                .unique();
            userId = user?._id || null;
        }

        const invoice = await ctx.db.get(args.id);
        if (!invoice) throw new Error("Invoice not found");

        // GoBD Compliance: Only allow editing drafts
        if (invoice.status !== "draft") {
            throw new Error("Cannot edit non-draft invoices. Create a credit note or new invoice instead.");
        }

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;

        args.items.forEach(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTax = lineTotal * (item.taxRate / 100);
            subtotal += lineTotal;
            taxTotal += lineTax;
        });

        const total = subtotal + taxTotal;

        // Update invoice
        await ctx.db.patch(args.id, {
            customerId: args.customerId,
            date: args.date,
            dueDate: args.dueDate,
            subtotal,
            taxTotal,
            total,
            notes: args.notes,
            paymentTerms: args.paymentTerms,
            relatedCalendarEvents: args.relatedCalendarEvents,
            updatedAt: Date.now(),
        });

        // Delete existing items
        const existingItems = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
            .collect();

        for (const item of existingItems) {
            await ctx.db.delete(item._id);
        }

        // Create new items
        for (const item of args.items) {
            await ctx.db.insert("invoiceItems", {
                invoiceId: args.id,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                total: item.quantity * item.unitPrice,
                serviceDate: item.serviceDate,
                startTime: item.startTime,
                endTime: item.endTime,
                calendarEventId: item.calendarEventId,
            });
        }

        // Audit Log
        if (userId) {
            await ctx.db.insert("invoiceAuditLog", {
                workspaceId: invoice.workspaceId,
                invoiceId: args.id,
                userId: userId,
                action: "updated",
                timestamp: Date.now(),
            });
        }

        return args.id;
    },
});

export const generateMonthlyInvoices = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        year: v.number(),
        month: v.number(), // 1-12
    },
    handler: async (ctx, args) => {
        const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
        const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();

        // Get all customers
        const customers = await ctx.db
            .query("customers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const generatedInvoiceIds = [];

        for (const customer of customers) {
            // Find billable lessons for this customer in the given month
            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_customer", (q) =>
                    q.eq("customerId", customer._id)
                )
                .filter((q) => q.gte(q.field("start"), startOfMonth))
                .filter((q) =>
                    q.and(
                        q.lte(q.field("start"), endOfMonth),
                        q.eq(q.field("isBillable"), true),
                        q.eq(q.field("invoiceId"), undefined)
                    )
                )
                .collect();

            if (lessons.length === 0) continue;

            // Create Invoice
            // Use default payment terms and tax rate from settings or customer
            const settings = await ctx.db
                .query("companySettings")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
                .first();

            const taxRate = customer.isVatExempt ? 0 : (settings?.defaultTaxRate || 19);
            const paymentTerms = customer.paymentTermsDays || settings?.defaultPaymentTermsDays || 14;

            const invoiceDate = Date.now();
            const dueDate = invoiceDate + (paymentTerms * 24 * 60 * 60 * 1000);

            // Generate Invoice Number
            // We reuse the logic from createInvoice, but we need to duplicate it or extract it.
            // Since generateInvoiceNumber helper is not exported or easily reusable without refactor, 
            // I'll use the helper function defined at the top of this file.
            const invoiceNumber = await generateInvoiceNumber(ctx, args.workspaceId);

            // Create Invoice Items from Lessons
            const items = [];
            let subtotal = 0;
            let taxTotal = 0;

            for (const lesson of lessons) {
                let rate = 0;
                let quantity = 0;
                let unit = "";
                let lineTotal = 0;

                if (lesson.rate) {
                    // Fixed Price logic (lesson.rate is in Euros)
                    rate = Math.round(lesson.rate * 100); // Convert to Cents
                    quantity = 1;
                    unit = "Lesson";
                    lineTotal = rate;
                } else {
                    // Hourly Rate logic (customer.defaultHourlyRate is in Euros)
                    const hourlyRateEuros = customer.defaultHourlyRate || settings?.defaultHourlyRate || 0;
                    rate = Math.round(hourlyRateEuros * 100); // Convert to Cents

                    const durationMs = lesson.end - lesson.start;
                    const durationHours = durationMs / (1000 * 60 * 60);
                    quantity = Math.round(durationHours * 100) / 100;
                    unit = "Hour";
                    lineTotal = Math.round(quantity * rate);
                }

                const lineTax = Math.round(lineTotal * (taxRate / 100));

                subtotal += lineTotal;
                taxTotal += lineTax;

                // Description Logic: Use first service description template or fallback
                const description = customer.serviceDescriptions?.[0] || "Lesson";

                items.push({
                    description,
                    quantity,
                    unit,
                    unitPrice: rate,
                    taxRate,
                    total: lineTotal,
                    serviceDate: new Date(lesson.start).toISOString().split('T')[0],
                    startTime: new Date(lesson.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    endTime: new Date(lesson.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    calendarEventId: lesson._id,
                });
            }

            const total = subtotal + taxTotal;

            const invoiceId = await ctx.db.insert("invoices", {
                workspaceId: args.workspaceId,
                customerId: customer._id,
                invoiceNumber,
                date: invoiceDate,
                dueDate: dueDate,
                status: "draft",
                subtotal,
                taxTotal,
                total,
                paymentTerms: `${paymentTerms} Days`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Insert Items
            for (const item of items) {
                await ctx.db.insert("invoiceItems", {
                    invoiceId,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    total: item.total,
                    serviceDate: item.serviceDate,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    calendarEventId: item.calendarEventId,
                });
            }

            // Update Lessons with Invoice ID
            for (const lesson of lessons) {
                await ctx.db.patch(lesson._id, {
                    invoiceId,
                    updatedAt: Date.now(),
                });
            }

            generatedInvoiceIds.push(invoiceId);
        }

        return generatedInvoiceIds;
    },
});

export const runMonthlyInvoiceGenerationAction = action({
    args: {},
    handler: async (ctx) => {
        const now = new Date();
        // Calculate previous month (Cron runs on 1st of month)
        // If today is Feb 1st, we want Jan invoices.
        let year = now.getFullYear();
        let month = now.getMonth(); // 0-11. 0 is Jan.

        if (month === 0) {
            month = 12; // Dec
            year -= 1;
        }
        // If month is 1 (Feb), month becomes 1 (Jan) in 1-12 scale.
        // So `month` variable (0-11) maps directly to 1-12 scale for previous month?
        // Feb (1) -> we want Jan (1).
        // Jan (0) -> we want Dec (12).
        // So if month > 0, we use month. If month === 0, we use 12.
        // Wait, `now.getMonth()` returns 0 for Jan.
        // If now is Feb (1), we want Jan (1). So `month` (1) is correct?
        // Yes.
        // If now is Mar (2), we want Feb (2). So `month` (2) is correct.
        // So logic: if month === 0, year--, month=12. Else month = month.


        // We need to list workspaces. We can't query DB directly in action.
        // We need a helper query to list workspaces.
        const workspaces = await ctx.runQuery(internal.invoices.listAllWorkspaces);

        for (const workspace of workspaces) {
            await ctx.runMutation(api.invoices.generateMonthlyInvoices, {
                workspaceId: workspace._id,
                year,
                month,
            });
        }
    }
});

export const deleteInvoice = mutation({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const invoice = await ctx.db.get(args.id);
        if (!invoice) return;

        // Only allow deleting drafts
        if (invoice.status !== "draft") {
            throw new Error("Only draft invoices can be deleted. Cancel sent invoices instead.");
        }

        // 1. Unlink lessons and delete items
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
            .collect();

        for (const item of items) {
            await ctx.db.delete(item._id);
        }

        // Unlink lessons using the index on lessons table
        const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
            .collect();

        for (const lesson of lessons) {
            await ctx.db.patch(lesson._id, { invoiceId: undefined });
        }

        // 2. Delete invoice
        await ctx.db.delete(args.id);
    }
});

export const listAllWorkspaces = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("workspaces").collect();
    },
});

export const inspectData = query({
    handler: async (ctx) => {
        const lessons = await ctx.db.query("lessons").order("desc").take(5);
        const invoiceItems = await ctx.db.query("invoiceItems").order("desc").take(5);
        const customers = await ctx.db.query("customers").take(5);

        return {
            lessons: lessons.map(l => ({ id: l._id, title: l.title, rate: l.rate, invoiceId: l.invoiceId })),
            invoiceItems: invoiceItems.map(i => ({ id: i._id, desc: i.description, unitPrice: i.unitPrice, total: i.total })),
            customers: customers.map(c => ({ id: c._id, name: c.name, defaultHourlyRate: c.defaultHourlyRate }))
        };
    },
});
