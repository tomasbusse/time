import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useWorkspace } from "../../lib/WorkspaceContext";
import CreateInvoicePage from "./CreateInvoicePage";
import CustomerListPage from "./CustomerListPage";
import {
    Download,
    Zap,
    Plus,
    Calendar,
    Users,
    Settings,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    Send,
    AlertCircle
} from "lucide-react";

export default function InvoicesPage() {
    const { workspaceId } = useWorkspace();
    const invoices = useQuery(
        api.invoices.listInvoices,
        workspaceId ? { workspaceId } : "skip"
    );
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreatePage, setShowCreatePage] = useState(false);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const exportCSV = useAction(api.invoices.exportCSV);
    const updateStatus = useMutation(api.invoices.updateInvoiceStatus);
    const generateMonthly = useMutation(api.invoices.generateMonthlyInvoices);

    const handleGenerate = async () => {
        if (!workspaceId) return;
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        if (confirm(`Generate draft invoices for ${monthName}? This will create invoices for all billable lessons in ${monthName} that haven't been invoiced yet.`)) {
            try {
                await generateMonthly({
                    workspaceId,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1 // 1-12
                });
                alert("Drafts generated!");
            } catch (error) {
                alert("Failed to generate drafts: " + error);
            }
        }
    };

    // If showing create page, render CreateInvoicePage instead
    if (showCreatePage) {
        return <CreateInvoicePage
            onBack={() => setShowCreatePage(false)}
            onManageCustomers={() => { setShowCreatePage(false); setShowCustomerList(true); }}
        />;
    }

    // If showing customer list, render CustomerListPage instead
    if (showCustomerList) {
        return <CustomerListPage onBack={() => setShowCustomerList(false)} />;
    }

    const filteredInvoices = invoices?.filter(inv => {
        const matchesStatus = filterStatus === "all" ? true :
            filterStatus === "open" ? (inv.status === "sent" && inv.dueDate < Date.now()) :
                inv.status === filterStatus;
        const matchesSearch = searchQuery === "" ||
            inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.customerNumber && inv.customerNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Calculate stats
    const stats = {
        totalRevenue: invoices?.filter(i => i.status === "paid").reduce((acc, curr) => acc + curr.total, 0) || 0,
        openAmount: invoices?.filter(i => i.status === "sent" && i.dueDate < Date.now()).reduce((acc, curr) => acc + curr.total, 0) || 0,
        draftTotal: invoices?.filter(i => i.status === "draft").reduce((acc, curr) => acc + curr.total, 0) || 0,
        sentTotal: invoices?.filter(i => i.status === "sent").reduce((acc, curr) => acc + curr.total, 0) || 0,
    };

    // Calculate filtered total
    const filteredTotal = filteredInvoices?.reduce((acc, curr) => acc + curr.total, 0) || 0;

    const handleExport = async () => {
        if (!workspaceId) return;
        try {
            const invoiceIds = filteredInvoices?.map(inv => inv._id) || [];
            if (invoiceIds.length === 0) {
                alert("No invoices to export");
                return;
            }

            const base64Data = await exportCSV({
                workspaceId,
                invoiceIds,
            });

            const link = document.createElement("a");
            link.href = `data:text/csv;base64,${base64Data}`;
            link.download = `invoices_export_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export CSV");
        }
    };

    const handleMarkAsPaid = async (id: Id<"invoices">) => {
        if (confirm("Mark this invoice as paid?")) {
            await updateStatus({ id, status: "paid" });
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount / 100);

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#DDDEE3]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#384C5A] tracking-tight">Invoices</h1>
                    <div className="flex gap-6 mt-3 text-sm font-medium text-gray-500">
                        <button
                            onClick={() => window.location.hash = "#/invoices/lessons"}
                            className="hover:text-[#384C5A] flex items-center gap-2 transition-colors"
                        >
                            <Calendar size={18} /> Lessons
                        </button>
                        <button
                            onClick={() => window.location.hash = "#/invoices/customers"}
                            className="hover:text-[#384C5A] flex items-center gap-2 transition-colors"
                        >
                            <Users size={18} /> Customers
                        </button>
                        <button
                            onClick={() => window.location.hash = "#/invoices/settings"}
                            className="hover:text-[#384C5A] flex items-center gap-2 transition-colors"
                        >
                            <Settings size={18} /> Settings
                        </button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-[#F1F5EE] border border-transparent text-[#384C5A] rounded-lg hover:bg-white transition-all shadow-sm font-medium flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-[#F1F5EE] border border-transparent text-[#384C5A] rounded-lg hover:bg-white transition-all shadow-sm font-medium flex items-center gap-2"
                    >
                        <Zap size={16} /> Generate Drafts
                    </button>
                    <button
                        onClick={() => setShowCreatePage(true)}
                        className="px-4 py-2 bg-[#A78573] text-white rounded-lg hover:bg-[#8e6f5e] transition-all shadow-md font-medium flex items-center gap-2"
                    >
                        <Plus size={18} /> Create Invoice
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#F1F5EE] p-6 rounded-xl shadow-sm border border-transparent">
                    <div className="text-sm font-medium text-gray-500 mb-2">Total Revenue (Paid)</div>
                    <div className="text-3xl font-bold text-[#384C5A]">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div className="bg-[#F1F5EE] p-6 rounded-xl shadow-sm border border-transparent">
                    <div className="text-sm font-medium text-gray-500 mb-2">Sent (Unpaid)</div>
                    <div className="text-3xl font-bold text-[#A78573]">{formatCurrency(stats.sentTotal)}</div>
                </div>
                <div className="bg-[#F1F5EE] p-6 rounded-xl shadow-sm border border-transparent">
                    <div className="text-sm font-medium text-gray-500 mb-2">Draft Total</div>
                    <div className="text-3xl font-bold text-[#384C5A]">{formatCurrency(stats.draftTotal)}</div>
                </div>
                <div className="bg-[#F1F5EE] p-6 rounded-xl shadow-sm border border-transparent">
                    <div className="text-sm font-medium text-gray-500 mb-2">Overdue (Open)</div>
                    <div className="text-3xl font-bold text-orange-600">{formatCurrency(stats.openAmount)}</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-[#F1F5EE] rounded-xl shadow-sm border border-transparent overflow-hidden mb-8">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-[#EAEAEA] p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                        {["all", "draft", "sent", "open", "paid", "cancelled"].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status
                                    ? "bg-[#384C5A] text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {status === "open" ? "Open (Overdue)" : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#EAEAEA] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-[#F1F5EE]">
                            {filteredInvoices?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No invoices found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices?.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-white transition-colors group border-b border-gray-100 last:border-0">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-[#384C5A]">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {invoice.customerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {new Date(invoice.date).toLocaleDateString("de-DE")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {new Date(invoice.dueDate).toLocaleDateString("de-DE")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-[#384C5A]">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === "paid" ? "bg-green-100 text-green-800" :
                                                    invoice.status === "sent" ? "bg-orange-100 text-[#A78573]" :
                                                        invoice.status === "draft" ? "bg-gray-200 text-gray-700" :
                                                            "bg-gray-100 text-gray-600"
                                                }`}>
                                                {invoice.status === "sent" && invoice.dueDate < Date.now() ? (
                                                    <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                        <AlertCircle size={12} /> Overdue
                                                    </span>
                                                ) : (
                                                    invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => window.location.hash = `#/invoices/preview/${invoice._id}`}
                                                className="text-[#A78573] hover:text-[#8e6f5e] font-medium transition-colors mr-4"
                                            >
                                                View
                                            </button>
                                            {invoice.status === "sent" && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(invoice._id)}
                                                    className="text-[#384C5A] hover:text-black font-medium transition-colors"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
