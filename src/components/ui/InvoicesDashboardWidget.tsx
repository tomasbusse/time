import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { FileText, AlertCircle } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { format } from 'date-fns'

interface InvoicesDashboardWidgetProps {
    workspaceId: Id<"workspaces">
}

export function InvoicesDashboardWidget({ workspaceId }: InvoicesDashboardWidgetProps) {
    const openInvoices = useQuery(api.invoices.getOpenInvoices, { workspaceId })

    if (!openInvoices) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
        )
    }

    if (openInvoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No open invoices</p>
                <p className="text-gray-400 text-xs mt-1">All caught up!</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {openInvoices.map((invoice) => (
                <Link
                    key={invoice._id}
                    to={`/invoices/preview/${invoice._id}`}
                    className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-dark-blue text-sm">
                                    {invoice.invoiceNumber}
                                </span>
                                {invoice.isOverdue && (
                                    <span className="flex items-center gap-1 text-xs text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        Overdue
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                                {invoice.customerName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-bold ${invoice.isOverdue ? 'text-red-600' : 'text-dark-blue'}`}>
                                {formatCurrency(invoice.total)}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}

            <Link
                to="/invoices"
                className="block text-center text-custom-brown hover:text-brown text-sm font-medium pt-2"
            >
                View all →
            </Link>
        </div>
    )
}
