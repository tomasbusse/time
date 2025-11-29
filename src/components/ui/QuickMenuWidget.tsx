import { Plus, Clock, Calendar, Folder, FileText, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickMenuItemProps {
    icon: React.ElementType
    label: string
    to: string
    color?: string
}

function QuickMenuItem({ icon: Icon, label, to, color = "text-custom-brown" }: QuickMenuItemProps) {
    return (
        <Link to={to} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm transition-all group-hover:shadow-md group-hover:border-custom-brown/30 group-active:scale-95">
                <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${color}`} />
            </div>
            <span className="text-sm font-medium text-dark-blue group-hover:text-custom-brown transition-colors">{label}</span>
        </Link>
    )
}

export function QuickMenuWidget() {
    return (
        <div className="w-full overflow-x-auto pb-4 pt-2 px-2 -mx-2 scrollbar-hide">
            <div className="flex justify-between sm:justify-start sm:gap-12 min-w-max px-2">
                <QuickMenuItem
                    icon={Plus}
                    label="New Task"
                    to="/productivity"
                />
                <QuickMenuItem
                    icon={Clock}
                    label="Focus Mode"
                    to="/productivity"
                />
                <QuickMenuItem
                    icon={Calendar}
                    label="Calendar"
                    to="/calendar"
                />
                <QuickMenuItem
                    icon={Folder}
                    label="Projects"
                    to="/productivity"
                />
                <QuickMenuItem
                    icon={FileText}
                    label="Invoices"
                    to="/invoices"
                />
                <QuickMenuItem
                    icon={Users}
                    label="Customers"
                    to="/invoices/customers"
                />
            </div>
        </div>
    )
}
