import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card } from '@/components/ui/Card'
import { FileText, Users, AlertCircle, CheckCircle } from 'lucide-react'

export default function InvoiceOverview() {
    const { workspaceId } = useWorkspace()

    const invoices = useQuery(api.invoices.listInvoices, workspaceId ? { workspaceId } : 'skip')
    const customers = useQuery(api.customers.listCustomers, workspaceId ? { workspaceId } : 'skip')

    const totalInvoices = invoices?.length || 0
    const openInvoices = invoices?.filter((inv: any) => inv.status === 'sent').length || 0
    const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0
    const totalCustomers = customers?.length || 0

    const totalRevenue = invoices
        ?.filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.total, 0) || 0

    const outstandingAmount = invoices
        ?.filter((inv: any) => inv.status === 'sent')
        .reduce((sum: number, inv: any) => sum + inv.total, 0) || 0

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount / 100)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-dark-blue mb-2">Invoice Overview</h2>
                <p className="text-gray-600">Summary of your invoicing activities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Total Invoices</div>
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-dark-blue">{totalInvoices}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        {paidInvoices} paid, {openInvoices} open
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Open Invoices</div>
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-dark-blue">{openInvoices}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        {formatCurrency(outstandingAmount)} outstanding
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Total Revenue</div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-dark-blue">{formatCurrency(totalRevenue)}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        From {paidInvoices} paid invoices
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-600">Customers</div>
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-dark-blue">{totalCustomers}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        Active clients
                    </div>
                </Card>
            </div>
        </div>
    )
}