import { CheckCircle2, Lightbulb, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickMenuItemProps {
    icon: React.ElementType
    label: string
    to: string
    color?: string
}

function QuickMenuItem({ icon: Icon, label, to, color = "text-custom-brown" }: QuickMenuItemProps) {
    return (
        <Link to={to} className="flex flex-col items-center gap-3 group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-custom-off-white border-2 border-custom-brown flex items-center justify-center shadow-sm transition-all group-hover:shadow-md group-hover:scale-105 group-active:scale-95 relative">
                {/* Inner circle for styling effect */}
                <div className="absolute inset-2 rounded-full border border-custom-brown/10"></div>
                <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${color}`} />
            </div>
            <span className="text-base font-bold text-dark-blue group-hover:text-custom-brown transition-colors">{label}</span>
        </Link>
    )
}

export function QuickMenuWidget() {
    return (
        <div className="w-full px-4 py-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 max-w-sm mx-auto">
                <QuickMenuItem
                    icon={CheckCircle2}
                    label="Tasks"
                    to="/productivity?view=tasks"
                />
                <QuickMenuItem
                    icon={Lightbulb}
                    label="Ideas"
                    to="/productivity?view=ideas"
                />
                <QuickMenuItem
                    icon={TrendingUp}
                    label="Liquidity"
                    to="/finance?tab=budget"
                />
                <QuickMenuItem
                    icon={Wallet}
                    label="Assets"
                    to="/finance?tab=assets"
                />
            </div>
        </div>
    )
}
