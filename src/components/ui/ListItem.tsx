import { LucideIcon } from 'lucide-react'

interface ListItemProps {
    title: string
    subtitle?: string
    icon?: LucideIcon
    rightIcon?: LucideIcon
    onClick?: () => void
    statusColor?: string // e.g., 'bg-green-500', 'border-gray-300'
}

export function ListItem({ title, subtitle, icon: Icon, rightIcon: RightIcon, onClick, statusColor = 'border-gray-300' }: ListItemProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between py-3 group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center gap-3">
                {/* Status Indicator / Icon */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${statusColor}`}>
                    {/* Optional checkmark or inner dot could go here */}
                </div>

                <div>
                    <h3 className="font-bold text-dark-blue text-sm leading-tight">{title}</h3>
                    {subtitle && (
                        <p className="text-gray-400 text-xs mt-0.5 font-medium">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-2 text-gray-400">
                {Icon && <Icon className="w-5 h-5" />}
                {RightIcon && <RightIcon className="w-5 h-5" />}
            </div>
        </div>
    )
}
