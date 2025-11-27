import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendInvoiceEmail = action({
    args: {
        invoiceId: v.id("invoices"),
        to: v.string(),
        cc: v.optional(v.string()),
        subject: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Import Resend dynamically to avoid build issues
        const { Resend } = await import("resend");

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Fetch invoice with all details
        const invoiceData = await ctx.runQuery(api.invoices.getInvoice, {
            id: args.invoiceId
        });

        if (!invoiceData) {
            throw new Error("Invoice not found");
        }

        // Get company settings for sender info
        const companySettings = await ctx.runQuery(api.companySettings.getSettings, {
            workspaceId: invoiceData.workspaceId
        });

        // Send email
        const emailResult = await resend.emails.send({
            from: companySettings?.email || "invoices@yourdomain.com",
            to: args.to,
            cc: args.cc,
            subject: args.subject,
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        ${args.message.replace(/\n/g, '<br>')}
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        
                        <p style="font-size: 12px; color: #666;">
                            ${companySettings?.companyName || 'Company'}<br>
                            ${companySettings?.addressLine1 || ''}<br>
                            ${companySettings?.zipCode || ''} ${companySettings?.city || ''}<br>
                            ${companySettings?.email || ''}
                        </p>
                    </body>
                </html>
            `,
        });

        if (emailResult.error) {
            throw new Error(`Failed to send email: ${emailResult.error.message}`);
        }

        // Update invoice status to "sent" if it was a draft
        if (invoiceData.status === "draft") {
            await ctx.runMutation(api.invoices.updateInvoiceStatus, {
                id: args.invoiceId,
                status: "sent",
            });
        }

        return { success: true, emailId: emailResult.data?.id };
    },
});
export const sendEmail = action({
    args: {
        to: v.string(),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (ctx, args) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        // We don't have workspaceId here to fetch company settings easily unless passed.
        // For now, use a default from address.
        const from = "notifications@yourdomain.com";

        const { data, error } = await resend.emails.send({
            from,
            to: args.to,
            subject: args.subject,
            html: args.html,
        });

        if (error) {
            console.error("Failed to send email:", error);
            throw new Error("Failed to send email");
        }

        return { success: true, id: data?.id };
    },
});
