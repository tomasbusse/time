import { Link } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Home() {
  // Mock user ID - in a real app this would come from authentication
  const userId = "user-123";

  // Get Flow time allocation summary
  const timeSummary = useQuery(api.flow.getTimeAllocationSummary, { userId });
  const recentTasks = useQuery(api.flow.getTasks, { userId });

  // Calculate completion rate
  const completedTasks = recentTasks?.filter(task => task.completed).length || 0;
  const totalTasks = recentTasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get most recent 3 tasks for display
  const recentTasksToShow = recentTasks?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-3">Welcome to LifeHub</h1>
          <p className="text-primary-100 text-lg">Your all-in-one productivity dashboard</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-100 p-3 rounded-lg">
              <span className="material-symbols-outlined text-primary-600 text-2xl">psychology</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Flow Tasks</h3>
              <p className="text-2xl font-bold text-text-primary">{totalTasks}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">{completedTasks} completed ({completionRate}%)</p>
        </div>

        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-success/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-success text-2xl">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Budget</h3>
              <p className="text-2xl font-bold text-text-primary">$2,450</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">This month</p>
        </div>

        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-accent-100 p-3 rounded-lg">
              <span className="material-symbols-outlined text-accent-600 text-2xl">restaurant_menu</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Meals</h3>
              <p className="text-2xl font-bold text-text-primary">12</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">Recipes saved</p>
        </div>

        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-info/10 p-3 rounded-lg">
              <span className="material-symbols-outlined text-info text-2xl">timer</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Time Allocated</h3>
              <p className="text-2xl font-bold text-text-primary">{timeSummary?.tasksWithAllocation || 0}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">Tasks with allocation</p>
        </div>
      </div>

      {/* Flow Time Allocation Widget */}
      {timeSummary && (timeSummary.totalDailyAllocation > 0 || timeSummary.totalWeeklyAllocation > 0) && (
        <div className="bg-gradient-to-r from-primary-50 via-accent-50 to-info-50 rounded-xl p-8 border border-primary-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-600">psychology</span>
                Flow Time Allocation
              </h2>
              <p className="text-text-secondary mt-1">Your time investment overview</p>
            </div>
            <Link 
              to="/todos"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              View Flow
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {timeSummary.totalDailyAllocation > 0 && (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <div className="text-3xl font-bold text-primary-600 mb-1">{timeSummary.totalDailyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary font-medium">Hours/Day</div>
                <div className="text-xs text-text-muted mt-1">Daily commitment</div>
              </div>
            )}
            
            {timeSummary.totalWeeklyAllocation > 0 && (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <div className="text-3xl font-bold text-accent-600 mb-1">{timeSummary.totalWeeklyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary font-medium">Hours/Week</div>
                <div className="text-xs text-text-muted mt-1">Weekly target</div>
              </div>
            )}
            
            {timeSummary.totalMonthlyAllocation > 0 && (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <div className="text-3xl font-bold text-info-600 mb-1">{timeSummary.totalMonthlyAllocation.toFixed(1)}</div>
                <div className="text-sm text-text-secondary font-medium">Hours/Month</div>
                <div className="text-xs text-text-muted mt-1">Monthly scope</div>
              </div>
            )}
            
            {timeSummary.totalTimeSpent > 0 && (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <div className="text-3xl font-bold text-success-600 mb-1">{timeSummary.totalTimeSpent.toFixed(1)}</div>
                <div className="text-sm text-text-secondary font-medium">Hours Spent</div>
                <div className="text-xs text-text-muted mt-1">Progress made</div>
              </div>
            )}
          </div>

          {/* Progress indicators */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Task Completion</span>
                <span className="text-sm font-bold text-primary-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="bg-white/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Time Utilization</span>
                <span className="text-sm font-bold text-success-600">
                  {timeSummary.totalDailyAllocation > 0 && timeSummary.totalTimeSpent > 0 
                    ? `${Math.round((timeSummary.totalTimeSpent / (timeSummary.totalDailyAllocation * 7)) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-success-500 to-primary-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${timeSummary.totalDailyAllocation > 0 && timeSummary.totalTimeSpent > 0 
                      ? Math.min((timeSummary.totalTimeSpent / (timeSummary.totalDailyAllocation * 7)) * 100, 100)
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Widget */}
        <div className="lg:col-span-2 bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">Calendar</h2>
            <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="text-center py-16 text-text-muted">
            <div className="bg-primary-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary-600 text-4xl">calendar_month</span>
            </div>
            <p className="text-text-secondary font-medium">Google Calendar integration coming soon</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/todos"
              className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200">
                <span className="material-symbols-outlined text-primary-600">add</span>
              </div>
              <span className="text-sm font-medium text-text-primary">Add Flow Task</span>
            </Link>
            <Link
              to="/finance"
              className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="bg-success/10 p-2 rounded-lg group-hover:bg-success/20">
                <span className="material-symbols-outlined text-success">add</span>
              </div>
              <span className="text-sm font-medium text-text-primary">Log Expense</span>
            </Link>
            <Link
              to="/shopping"
              className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="bg-accent-100 p-2 rounded-lg group-hover:bg-accent-200">
                <span className="material-symbols-outlined text-accent-600">add</span>
              </div>
              <span className="text-sm font-medium text-text-primary">Add to Shopping List</span>
            </Link>
            <Link
              to="/meals"
              className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="bg-warning/10 p-2 rounded-lg group-hover:bg-warning/20">
                <span className="material-symbols-outlined text-warning">add</span>
              </div>
              <span className="text-sm font-medium text-text-primary">Plan Meal</span>
            </Link>
          </div>
        </div>

        {/* Recent Flow Tasks */}
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">Recent Flow Tasks</h2>
            <Link to="/todos" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasksToShow.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <div className="bg-primary-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-primary-600">psychology</span>
                </div>
                <p className="text-sm">No Flow tasks yet</p>
                <Link 
                  to="/todos"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                >
                  Create your first task
                </Link>
              </div>
            ) : (
              recentTasksToShow.map((task) => (
                <div key={task._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors duration-200">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    className="form-checkbox size-5 rounded text-primary-600 border-border-light focus:ring-primary-500" 
                    readOnly
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm truncate block ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-error/10 text-error' :
                        task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {task.priority}
                      </span>
                      {(task.dailyAllocation || task.weeklyAllocation) && (
                        <span className="text-xs text-primary-600">
                          {task.dailyAllocation && `${task.dailyAllocation}h/day`}
                          {task.weeklyAllocation && `${task.weeklyAllocation}h/week`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shopping List Preview */}
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">Shopping List</h2>
            <Link to="/shopping" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors duration-200">
              <input type="checkbox" className="form-checkbox size-5 rounded text-primary-600 border-border-light focus:ring-primary-500" />
              <span className="text-sm text-text-primary">Milk</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors duration-200">
              <input type="checkbox" className="form-checkbox size-5 rounded text-primary-600 border-border-light focus:ring-primary-500" />
              <span className="text-sm text-text-primary">Bread</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors duration-200">
              <input type="checkbox" className="form-checkbox size-5 rounded text-primary-600 border-border-light focus:ring-primary-500" />
              <span className="text-sm text-text-primary">Eggs</span>
            </div>
          </div>
        </div>

        {/* Upcoming Meals */}
        <div className="bg-background-light rounded-xl p-6 border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">This Week's Meals</h2>
            <Link to="/meals" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
              <p className="text-xs font-semibold text-primary-700 mb-1">Monday Dinner</p>
              <p className="text-sm font-medium text-text-primary">Spaghetti Bolognese</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-accent-50 to-accent-100 border border-accent-200">
              <p className="text-xs font-semibold text-accent-700 mb-1">Tuesday Lunch</p>
              <p className="text-sm font-medium text-text-primary">Chicken Salad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}