import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { FileText, Send, Plus } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from './Button'

interface DraftInvoicesDashboardWidgetProps {
    workspaceId: Id<"workspaces">
}

export function DraftInvoicesDashboardWidget({ workspaceId }: DraftInvoicesDashboardWidgetProps) {
    const draftInvoices = useQuery(api.invoices.getDraftInvoices, { workspaceId })
    const updateStatus = useMutation(api.invoices.updateInvoiceStatus)

    const handleFinalize = async (invoiceId: Id<"invoices">, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (confirm('Send this invoice to the customer?')) {
            await updateStatus({
                id: invoiceId,
                status: 'sent',
            })
        }
    }

    if (!draftInvoices) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
        )
    }

    if (draftInvoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm mb-3">No draft invoices</p>
                <Link to="/invoices/create">
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Invoice
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {draftInvoices.map((invoice) => (
                <Link
                    key={invoice._id}
                    to={`/invoices/edit/${invoice._id}`}
                    className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-dark-blue text-sm mb-1">
                                {invoice.invoiceNumber}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                                {invoice.customerName}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-sm font-bold text-dark-blue">
                                {formatCurrency(invoice.total)}
                            </div>
                            <button
                                onClick={(e) => handleFinalize(invoice._id, e)}
                                className="flex items-center gap-1 text-xs text-custom-brown hover:text-brown font-medium"
                            >
                                <Send className="w-3 h-3" />
                                Send
                            </button>
                        </div>
                    </div>
                </Link>
            ))}

            <Link
                to="/invoices?status=draft"
                className="block text-center text-custom-brown hover:text-brown text-sm font-medium pt-2"
            >
                View all drafts →
            </Link>
        </div>
    )
}
