import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get audit log for an invoice
export const getAuditLog = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("invoiceAuditLog")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
            .order("desc")
            .collect();

        // Enrich with user names
        const enriched = await Promise.all(logs.map(async (log) => {
            const user = await ctx.db.get(log.userId);
            return {
                ...log,
                userName: user?.name || "Unknown",
                userEmail: user?.email || "",
            };
        }));

        return enriched;
    },
});

// Archive an invoice (store PDF and mark as immutable)
export const archiveInvoice = mutation({
    args: {
        invoiceId: v.id("invoices"),
        pdfStorageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        // Check if already archived
        const existing = await ctx.db
            .query("archivedInvoices")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
            .first();

        if (existing) {
            throw new Error("Invoice is already archived");
        }

        // Calculate retention date (10 years from now as per GoBD)
        const retentionUntil = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);

        // Create archive record
        await ctx.db.insert("archivedInvoices", {
            workspaceId: invoice.workspaceId,
            invoiceId: args.invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            pdfStorageId: args.pdfStorageId,
            archivedAt: Date.now(),
            retentionUntil,
        });

        // Update invoice status to archived
        await ctx.db.patch(args.invoiceId, {
            status: "archived",
            updatedAt: Date.now(),
        });

        // Log the archival
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .unique();

        if (user) {
            await ctx.db.insert("invoiceAuditLog", {
                workspaceId: invoice.workspaceId,
                invoiceId: args.invoiceId,
                userId: user._id,
                action: "archived",
                details: `PDF stored with ID: ${args.pdfStorageId}`,
                timestamp: Date.now(),
            });
        }
    },
});

// List all archived invoices for a workspace
export const listArchivedInvoices = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const archives = await ctx.db
            .query("archivedInvoices")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .order("desc")
            .collect();

        // Enrich with invoice data
        const enriched = await Promise.all(archives.map(async (archive) => {
            const invoice = await ctx.db.get(archive.invoiceId);
            const customer = invoice ? await ctx.db.get(invoice.customerId) : null;

            return {
                ...archive,
                invoice,
                customerName: customer?.name || "Unknown",
            };
        }));

        return enriched;
    },
});

// Get archived invoice details
export const getArchivedInvoice = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const archive = await ctx.db
            .query("archivedInvoices")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
            .first();

        if (!archive) return null;

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice) return null;

        const customer = await ctx.db.get(invoice.customerId);
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
            .collect();

        return {
            ...archive,
            invoice: {
                ...invoice,
                customer,
                items,
            },
        };
    },
});

// Check if invoice is archived (and therefore immutable)
export const isInvoiceArchived = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const archive = await ctx.db
            .query("archivedInvoices")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
            .first();

        return !!archive;
    },
});

// Detect gaps in invoice numbering (GoBD compliance check)
export const detectInvoiceGaps = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        // Extract numeric parts and sort
        const numbers = invoices
            .map(inv => {
                const match = inv.invoiceNumber.match(/\d+$/);
                return match ? parseInt(match[0]) : null;
            })
            .filter(n => n !== null)
            .sort((a, b) => a! - b!);

        const gaps: Array<{ from: number; to: number }> = [];

        for (let i = 0; i < numbers.length - 1; i++) {
            const current = numbers[i]!;
            const next = numbers[i + 1]!;

            if (next - current > 1) {
                gaps.push({ from: current + 1, to: next - 1 });
            }
        }

        return gaps;
    },
});
