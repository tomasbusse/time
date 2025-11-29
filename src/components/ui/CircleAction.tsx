import { LucideIcon } from 'lucide-react'

interface CircleActionProps {
    label: string
    icon: LucideIcon
    onClick: () => void
    isActive?: boolean
}

export function CircleAction({ label, icon: Icon, onClick, isActive = false }: CircleActionProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 min-w-[80px]"
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                    ? 'bg-custom-brown text-white border-custom-brown'
                    : 'bg-[#F5F5F0] text-dark-blue border-dark-blue/10 hover:border-custom-brown'
                }`}>
                <Icon className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-dark-blue text-center leading-tight">
                {label}
            </span>
        </button>
    )
}
