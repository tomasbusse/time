import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { Id } from "../../../convex/_generated/dataModel";

export default function DraftsPage() {
    const { workspaceId } = useWorkspace();
    const invoices = useQuery(api.invoices.listInvoices, workspaceId ? { workspaceId } : "skip");
    const updateInvoiceStatus = useMutation(api.invoices.updateInvoiceStatus);

    const drafts = invoices?.filter((inv: any) => inv.status === "draft") || [];

    const handleSend = async (id: Id<"invoices">) => {
        if (confirm("Are you sure you want to mark this invoice as sent?")) {
            await updateInvoiceStatus({ id, status: "sent" });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount / 100);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Draft Invoices</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {drafts.map((invoice: any) => (
                            <tr key={invoice._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {invoice.invoiceNumber}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {invoice.customerName}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(invoice.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                    {formatCurrency(invoice.total)}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-right">
                                    <button
                                        onClick={() => handleSend(invoice._id)}
                                        className="text-dark-blue hover:underline"
                                    >
                                        Mark Sent
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {drafts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No draft invoices found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}