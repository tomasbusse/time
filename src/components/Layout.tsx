import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-off-white">
      {/* Sidebar */}
      <div className="flex flex-col justify-between bg-off-white-light w-72 p-6 border-r border-gray-light shadow-sm">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl shadow-md">
              <span className="material-symbols-outlined text-off-white text-2xl">dashboard</span>
            </div>
            <h1 className="text-2xl font-bold text-dark-blue">LifeHub</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/') && location.pathname === '/' ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>home</span>
              <p className="text-sm font-medium">Home</p>
            </Link>

            <Link
              to="/todos"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/todos')
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/todos') ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>psychology</span>
              <p className="text-sm font-medium">Flow</p>
            </Link>

            <Link
              to="/finance"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/finance')
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/finance') ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>account_balance_wallet</span>
              <p className="text-sm font-medium">Finance</p>
            </Link>

            <Link
              to="/shopping"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/shopping')
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/shopping') ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>shopping_cart</span>
              <p className="text-sm font-medium">Shopping</p>
            </Link>

            <Link
              to="/meals"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/meals')
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/meals') ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>restaurant_menu</span>
              <p className="text-sm font-medium">Meals & Recipes</p>
            </Link>

            <Link
              to="/calendar"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive('/calendar')
                  ? 'bg-off-white text-dark-blue shadow-sm border border-light-gray'
                  : 'text-gray hover:bg-off-white hover:text-dark-blue hover:shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${
                isActive('/calendar') ? 'text-dark-blue' : 'text-gray group-hover:text-dark-blue'
              }`}>calendar_month</span>
              <p className="text-sm font-medium">Calendar</p>
            </Link>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-off-white rounded-xl transition-all duration-200 group">
            <span className="material-symbols-outlined text-gray group-hover:text-dark-blue">settings</span>
            <p className="text-sm font-medium text-gray group-hover:text-dark-blue">Settings</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-off-white rounded-xl transition-all duration-200 group">
            <span className="material-symbols-outlined text-gray group-hover:text-dark-blue">logout</span>
            <p className="text-sm font-medium text-gray group-hover:text-dark-blue">Logout</p>
          </div>
          
          {/* User Profile */}
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-xl border border-light-gray mt-4">
            <div className="flex gap-3 items-center">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-full size-12 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-off-white">person</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold text-dark-blue">Alex Chen</h1>
                <p className="text-xs text-gray">alex.chen@email.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-off-white">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
