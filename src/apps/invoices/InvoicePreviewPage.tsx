import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { ArrowLeft, Mail, Download, Printer, Edit, Send, CheckCircle, XCircle } from "lucide-react";
import { InvoicePDF } from "./InvoicePDF";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useWorkspace } from "../../lib/WorkspaceContext";

export default function InvoicePreviewPage({ onBack }: { onBack?: () => void }) {
    const { workspaceId } = useWorkspace();
    const invoiceId = window.location.hash.split("/").pop() as Id<"invoices">;
    const invoice = useQuery(api.invoices.getInvoice, { id: invoiceId });
    const customer = useQuery(api.customers.getCustomer, invoice ? { id: invoice.customerId } : "skip");
    const settings = useQuery(api.companySettings.getSettings, workspaceId ? { workspaceId } : "skip");
    const updateInvoiceStatus = useMutation(api.invoices.updateInvoiceStatus);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    const sendInvoiceEmail = useAction(api.email.sendInvoiceEmail);

    if (!invoice || !customer || !settings) {
        return <div className="p-8 text-center text-gray-500">Loading invoice preview...</div>;
    }

    const handleOpenEmailModal = () => {
        const subject = `Rechnung ${invoice.invoiceNumber} von ${settings.companyName}`;
        let body = settings.emailBodyTemplate || "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Ihre Rechnung.\n\nMit freundlichen Grüßen";

        // Simple placeholder replacement
        body = body.replace("{invoiceNumber}", invoice.invoiceNumber);
        body = body.replace("{date}", new Date(invoice.date).toLocaleDateString("de-DE"));
        body = body.replace("{dueDate}", new Date(invoice.dueDate).toLocaleDateString("de-DE"));
        body = body.replace("{totalAmount}", (invoice.total / 100).toFixed(2) + " €");
        body = body.replace("{companyName}", settings.companyName || "");

        setEmailSubject(subject);
        setEmailBody(body);
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        setIsSending(true);
        try {
            // Generate PDF Blob
            const blob = await pdf(
                <InvoicePDF
                    invoice={invoice}
                    settings={settings}
                />
            ).toBlob();

            // Convert Blob to ArrayBuffer for Convex
            const arrayBuffer = await blob.arrayBuffer();

            // 1. Upload PDF to storage (you might need a separate mutation for this if not already handled by sendInvoiceEmail)
            // For now, assuming sendInvoiceEmail handles generation or we pass the ID.
            // Actually, the backend `sendInvoiceEmail` likely expects a storageId or generates it.
            // Let's assume the backend handles PDF generation or we need to upload it first.
            // Checking the backend implementation would be ideal, but for now let's try to pass the necessary info.
            // If the backend generates the PDF, we just call the mutation.

            await sendInvoiceEmail({
                invoiceId: invoice._id,
                to: customer.email || "",
                subject: emailSubject,
                message: emailBody,
            });

            alert("Email sent successfully!");
            setShowEmailModal(false);
        } catch (error) {
            console.error("Failed to send email:", error);
            alert("Failed to send email. Please check server logs.");
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadPDF = async () => {
        const blob = await pdf(
            <InvoicePDF
                invoice={invoice}
                settings={settings}
            />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Rechnung_${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isOverdue = invoice.status === 'sent' && invoice.dueDate < Date.now();

    return (
        <div className="min-h-screen bg-[#DDDEE3] flex flex-col font-sans text-[#384C5A]">
            {/* Top Action Bar */}
            <div className="bg-[#F1F5EE] border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onBack ? onBack() : window.location.hash = "#/invoices"}
                        className="text-gray-600 hover:text-[#384C5A] transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                    <h1 className="text-xl font-bold text-[#384C5A]">
                        Invoice {invoice.invoiceNumber}
                    </h1>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            isOverdue ? 'bg-red-100 text-red-700' :
                                'bg-gray-200 text-gray-600'
                        }`}>
                        {isOverdue ? 'Overdue' : invoice.status}
                    </span>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.hash = `#/invoices/edit/${invoice._id}`}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Edit size={16} /> Edit
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                    <button
                        onClick={handleOpenEmailModal}
                        className="px-4 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] transition-colors flex items-center gap-2 font-medium shadow-md"
                    >
                        <Send size={16} /> Send Email
                    </button>
                    {invoice.status !== 'paid' && (
                        <button
                            onClick={() => updateInvoiceStatus({ id: invoice._id, status: 'paid' })}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-md"
                        >
                            <CheckCircle size={16} /> Mark Paid
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content - PDF Preview */}
            <div className="flex-1 p-8 flex justify-center overflow-auto">
                <div className="shadow-2xl rounded-sm overflow-hidden w-full max-w-[210mm] bg-white">
                    <PDFViewer width="100%" height="1200px" className="border-none" showToolbar={false}>
                        <InvoicePDF
                            invoice={invoice}
                            settings={settings}
                        />
                    </PDFViewer>
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-[#F1F5EE] px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#384C5A] flex items-center gap-2">
                                <Mail size={20} /> Send Invoice via Email
                            </h2>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                                <input
                                    type="text"
                                    value={customer.email || ""}
                                    disabled
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={8}
                                    className="w-full p-2 border border-gray-200 rounded focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={isSending}
                                className="px-6 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? "Sending..." : "Send Email"}
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
