import { Home, ListTodo, Plus, Calendar, BarChart2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function BottomNavigation() {
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-50 lg:hidden pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-lg border border-gray-100 p-2 flex items-center justify-between max-w-sm mx-auto pointer-events-auto">
                <Link
                    to="/"
                    className={`flex flex-col items-center p-2 transition-colors ${isActive('/') ? 'text-dark-blue' : 'text-gray-400 hover:text-dark-blue'}`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Home</span>
                </Link>

                <Link
                    to="/productivity"
                    className={`flex flex-col items-center p-2 transition-colors ${isActive('/productivity') ? 'text-dark-blue' : 'text-gray-400 hover:text-dark-blue'}`}
                >
                    <ListTodo className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Tasks</span>
                </Link>

                <div className="-mt-8">
                    <button className="w-14 h-14 bg-custom-brown rounded-full flex items-center justify-center shadow-lg text-white hover:bg-brown transition-colors">
                        <Plus className="w-8 h-8" />
                    </button>
                </div>

                <Link
                    to="/calendar"
                    className={`flex flex-col items-center p-2 transition-colors ${isActive('/calendar') ? 'text-dark-blue' : 'text-gray-400 hover:text-dark-blue'}`}
                >
                    <Calendar className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Calendar</span>
                </Link>

                <Link
                    to="/stats"
                    className={`flex flex-col items-center p-2 transition-colors ${isActive('/stats') ? 'text-dark-blue' : 'text-gray-400 hover:text-dark-blue'}`}
                >
                    <BarChart2 className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Stats</span>
                </Link>
            </div>
        </div>
    )
}
