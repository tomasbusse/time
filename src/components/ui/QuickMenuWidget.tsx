import { CheckCircle2, Lightbulb, TrendingUp, Wallet } from 'lucide-react'

export type DashboardView = 'default' | 'tasks' | 'ideas' | 'liquidity' | 'assets'

interface QuickMenuItemProps {
    icon: React.ElementType
    label: string
    onClick: () => void
    isActive?: boolean
    color?: string
}

function QuickMenuItem({ icon: Icon, label, onClick, isActive = false, color = "text-custom-brown" }: QuickMenuItemProps) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-3 group">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ${isActive ? 'bg-custom-brown' : 'bg-custom-off-white'} border-2 border-custom-brown flex items-center justify-center shadow-sm transition-all group-hover:shadow-md group-hover:scale-105 group-active:scale-95 relative`}>
                {/* Inner circle for styling effect */}
                <div className="absolute inset-2 rounded-full border border-custom-brown/10"></div>
                <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${isActive ? 'text-white' : color}`} />
            </div>
            <span className={`text-base font-bold transition-colors ${isActive ? 'text-custom-brown' : 'text-dark-blue group-hover:text-custom-brown'}`}>{label}</span>
        </button>
    )
}

interface QuickMenuWidgetProps {
    selectedView: DashboardView
    onSelectView: (view: DashboardView) => void
}

export function QuickMenuWidget({ selectedView, onSelectView }: QuickMenuWidgetProps) {
    return (
        <div className="w-full px-4 py-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 max-w-sm mx-auto">
                <QuickMenuItem
                    icon={CheckCircle2}
                    label="Tasks"
                    onClick={() => onSelectView('tasks')}
                    isActive={selectedView === 'tasks'}
                />
                <QuickMenuItem
                    icon={Lightbulb}
                    label="Ideas"
                    onClick={() => onSelectView('ideas')}
                    isActive={selectedView === 'ideas'}
                />
                <QuickMenuItem
                    icon={TrendingUp}
                    label="Liquidity"
                    onClick={() => onSelectView('liquidity')}
                    isActive={selectedView === 'liquidity'}
                />
                <QuickMenuItem
                    icon={Wallet}
                    label="Assets"
                    onClick={() => onSelectView('assets')}
                    isActive={selectedView === 'assets'}
                />
            </div>
        </div>
    )
}
