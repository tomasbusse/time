import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Doc, Id } from '../../../convex/_generated/dataModel';

// Import components from time and flow apps
import TimerWidget from '../time/components/TimerWidget';
import TimeAllocationCard from '../time/components/TimeAllocationCard';
import TaskSelector from '../time/components/TaskSelector';
import TimeLogHistory from '../time/components/TimeLogHistory';
import TaskBoard from '../flow/components/TaskBoard';
import IdeaList, { Idea } from '../flow/components/IdeaList';
import TaskDetailModal from '../flow/components/TaskDetailModal';
import IdeaFormModal from '../flow/components/IdeaFormModal';
import IdeaDetailModal from '../flow/components/IdeaDetailModal';
import { Task } from '../flow/components/TaskBoard';

type TabType = 'tasks' | 'ideas' | 'history';
type ModalType = 'create' | 'edit' | null;

export default function ProductivityApp() {
    const { workspaceId, userId } = useWorkspace();
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showTaskSelector, setShowTaskSelector] = useState(false);
    const [activeTimer, setActiveTimer] = useState<Doc<'timeAllocations'> | null>(null);

    // Task modal states
    const [taskModalType, setTaskModalType] = useState<ModalType>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');

    // Idea modal states
    const [ideaModalType, setIdeaModalType] = useState<ModalType>(null);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [isIdeaDetailOpen, setIsIdeaDetailOpen] = useState(false);

    // Queries
    const allocations = useQuery(
        api.timeAllocations.list,
        workspaceId ? { workspaceId, date: format(selectedDate, 'yyyy-MM-dd') } : 'skip'
    );

    const tasksData = useQuery(api.flow.listTasks, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined;
    const tasks: Task[] = Array.isArray(tasksData) ? tasksData : [];

    const ideasData = useQuery(api.flow.listIdeas, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined;
    const ideas: Idea[] = Array.isArray(ideasData)
        ? ideasData.map((i: any) => ({
            id: i._id,
            title: i.title,
            description: i.description,
            richDescription: i.richDescription,
            category: i.category,
            tags: i.tags,
            priority: i.priority,
            attachments: i.attachments,
            status: i.status,
        }))
        : [];

    const relatedTasksData = useQuery(
        api.flow.getTasksByIdea,
        selectedIdeaId ? { ideaId: selectedIdeaId as any } : 'skip'
    ) as any[] | 'skip' | undefined;

    const relatedTasks = Array.isArray(relatedTasksData)
        ? relatedTasksData.map((t: any) => ({
            id: t._id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            createdAt: t.createdAt,
        }))
        : [];

    // Mutations
    const createAllocation = useMutation(api.timeAllocations.create);
    const updateAllocation = useMutation(api.timeAllocations.update);
    const deleteAllocation = useMutation(api.timeAllocations.remove);
    const logTime = useMutation(api.timeAllocations.logTime);

    const createTask = useMutation(api.flow.createTask);
    const updateTask = useMutation(api.flow.updateTask);
    const deleteTaskMutation = useMutation(api.flow.deleteTask);
    const createIdea = useMutation(api.flow.createIdea);
    const updateIdea = useMutation(api.flow.updateIdea);
    const updateIdeaStatus = useMutation(api.flow.updateIdeaStatus);
    const deleteIdeaMutation = useMutation(api.flow.deleteIdea);

    // Time allocation handlers
    const handleAddAllocation = (data: Partial<Doc<'timeAllocations'>>) => {
        if (!workspaceId || !userId || !data.taskName || !data.allocatedDuration || !data.taskId) return;
        createAllocation({
            workspaceId,
            userId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            weekNumber: Math.floor((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
            taskName: data.taskName,
            taskId: data.taskId,
            allocatedDuration: data.allocatedDuration,
            isRecurring: data.isRecurring,
            recurrenceType: data.recurrenceType as "daily" | "weekly" | "monthly" | "yearly" | undefined,
            recurrenceInterval: data.recurrenceInterval,
            recurrenceEndDate: data.recurrenceEndDate,
        });
    };

    const handleDeleteAllocation = (id: string) => {
        deleteAllocation({ id: id as Id<'timeAllocations'> });
    };

    const handleStartTimer = (allocation: Doc<'timeAllocations'>) => {
        setActiveTimer(allocation);
    };

    const handleStopTimer = (elapsedSeconds: number) => {
        if (activeTimer && workspaceId && userId) {
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            logTime({
                workspaceId,
                userId,
                allocationId: activeTimer._id,
                sessionStart: Date.now() - elapsedSeconds * 1000,
                sessionEnd: Date.now(),
                elapsedTime: elapsedMinutes,
            });
            setActiveTimer(null);
        }
    };

    // Task handlers
    const handleCreateTask = (status: 'todo' | 'in_progress' | 'completed') => {
        setNewTaskStatus(status);
        setTaskModalType('create');
    };

    const handleEditTask = (taskId: string) => {
        setSelectedTaskId(taskId);
        setTaskModalType('edit');
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            await deleteTaskMutation({ taskId: taskId as any });
        }
    };

    const handleSaveTask = async (taskData: any) => {
        if (taskModalType === 'create' && workspaceId && userId) {
            await createTask({
                workspaceId: workspaceId as any,
                userId: userId as any,
                ...taskData,
                status: newTaskStatus,
            });
            setTaskModalType(null);
        } else if (taskModalType === 'edit' && selectedTaskId) {
            await updateTask({
                taskId: selectedTaskId as any,
                ...taskData,
            });
            setTaskModalType(null);
            setSelectedTaskId(null);
        }
    };

    // Idea handlers
    const handleCreateIdea = () => {
        setSelectedIdeaId(null);
        setIdeaModalType('create');
    };

    const handleEditIdea = (idea: Idea) => {
        setSelectedIdeaId(idea.id);
        setIdeaModalType('edit');
    };

    const handleSaveIdea = async (ideaData: any) => {
        if (ideaModalType === 'create' && workspaceId && userId) {
            await createIdea({
                workspaceId: workspaceId as any,
                userId: userId as any,
                ...ideaData,
                status: 'new',
            });
            setIdeaModalType(null);
        } else if (ideaModalType === 'edit' && selectedIdeaId) {
            await updateIdea({
                ideaId: selectedIdeaId as any,
                ...ideaData,
            });
            setIdeaModalType(null);
            setSelectedIdeaId(null);
        }
    };

    const handleViewIdeaDetail = (ideaId: string) => {
        setSelectedIdeaId(ideaId);
        setIsIdeaDetailOpen(true);
    };

    const handleCreateMultipleTasks = async (taskTitles: string[]) => {
        if (!workspaceId || !userId || !selectedIdeaId) return;

        for (const title of taskTitles) {
            if (title.trim()) {
                await createTask({
                    workspaceId: workspaceId as any,
                    userId: userId as any,
                    title: title.trim(),
                    description: `Created from idea: ${ideas.find((i) => i.id === selectedIdeaId)?.title}`,
                    status: 'todo',
                    priority: 'medium',
                    ideaId: selectedIdeaId as any,
                });
            }
        }

        await updateIdeaStatus({
            ideaId: selectedIdeaId as any,
            status: 'converted',
        });
    };

    const handleArchiveIdea = async () => {
        if (!selectedIdeaId) return;
        await updateIdeaStatus({
            ideaId: selectedIdeaId as any,
            status: 'archived',
        });
        setIsIdeaDetailOpen(false);
        setSelectedIdeaId(null);
    };

    const handleConvertToTask = async (ideaId: string) => {
        const idea = ideas.find((i) => i.id === ideaId);
        if (!idea || !workspaceId || !userId) return;
        await createTask({
            workspaceId: workspaceId as any,
            userId: userId as any,
            title: idea.title,
            description: idea.description,
            status: 'todo',
            priority: 'medium',
        });
        await updateIdeaStatus({ ideaId: ideaId as any, status: 'converted' });
        setActiveTab('tasks');
    };

    const handleDeleteIdea = async (ideaId: string) => {
        if (confirm('Are you sure you want to delete this idea?')) {
            await deleteIdeaMutation({ ideaId: ideaId as any });
        }
    };

    // Stats
    const taskStats = {
        todo: tasks.filter((t) => t.status === 'todo').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        total: tasks.length,
    };

    const selectedTask = selectedTaskId ? tasks.find((t) => t._id === selectedTaskId) : null;

    return (
        <div className="min-h-screen bg-[#DDDEE3]">
            {/* Header */}
            <div className="bg-[#F1F5EE] border-b border-gray-200">
                <div className="max-w-[1800px] mx-auto px-8 py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-[#384C5A] hover:text-[#2c3b46] mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[#384C5A] mb-2">Productivity</h1>
                            <p className="text-gray-600">Manage your tasks, track time, and capture ideas</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {activeTab === 'tasks' && (
                                <>
                                    <div className="text-sm text-gray-600">
                                        {taskStats.completed} / {taskStats.total} completed
                                    </div>
                                    <Button onClick={() => handleCreateTask('todo')} className="bg-[#384C5A] hover:bg-[#2c3b46]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Task
                                    </Button>
                                </>
                            )}
                            {activeTab === 'ideas' && (
                                <Button onClick={handleCreateIdea} className="bg-[#384C5A] hover:bg-[#2c3b46]">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Idea
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-6">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tasks'
                                    ? 'border-[#A78573] text-[#A78573]'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                Tasks
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-[#384C5A]">
                                    {taskStats.total}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('ideas')}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ideas'
                                    ? 'border-[#A78573] text-[#A78573]'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                Ideas
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-[#384C5A]">
                                    {ideas.filter((i) => i.status !== 'archived').length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                                    ? 'border-[#A78573] text-[#A78573]'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                Time History
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1800px] mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Area (Tasks/Ideas/History) */}
                    <div className="lg:col-span-2">
                        {activeTab === 'tasks' && (
                            <TaskBoard
                                onEditTask={(taskId) => handleEditTask(taskId as string)}
                                onDeleteTask={(taskId) => handleDeleteTask(taskId as string)}
                                onCreateTask={handleCreateTask}
                            />
                        )}

                        {activeTab === 'ideas' && (
                            <IdeaList
                                ideas={ideas}
                                onAddIdea={handleCreateIdea}
                                onEditIdea={handleEditIdea}
                                onViewIdeaDetail={handleViewIdeaDetail}
                                onDeleteIdea={handleDeleteIdea}
                                onConvertToTask={handleConvertToTask}
                            />
                        )}

                        {activeTab === 'history' && <TimeLogHistory loggedEntries={[]} />}
                    </div>

                    {/* Sidebar (Time Allocations & Timer) */}
                    <div className="space-y-6">
                        {/* Date Selector */}
                        <div className="bg-[#F1F5EE] rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                    className="p-2 hover:bg-gray-200 rounded"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-lg font-semibold text-[#384C5A]">{format(selectedDate, 'MMM d, yyyy')}</h2>
                                <button
                                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                    className="p-2 hover:bg-gray-200 rounded"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Timer Widget */}
                            {activeTimer && (
                                <TimerWidget
                                    allocatedDuration={activeTimer.allocatedDuration}
                                    taskName={activeTimer.taskName}
                                    autoStart={true}
                                    initialElapsedSeconds={(activeTimer.timeSpent || 0) * 60}
                                    onStop={handleStopTimer}
                                />
                            )}
                        </div>

                        {/* Today's Allocations */}
                        <div className="bg-[#F1F5EE] rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#384C5A]">Today's Allocations</h3>
                                <Button
                                    onClick={() => setShowTaskSelector(true)}
                                    className="bg-[#384C5A] hover:bg-[#2c3b46] text-sm py-1 px-3"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {allocations?.map((allocation) => (
                                    <TimeAllocationCard
                                        key={allocation._id}
                                        taskName={allocation.taskName}
                                        allocatedDuration={allocation.allocatedDuration}
                                        timeSpent={allocation.timeSpent ?? 0}
                                        category={undefined}
                                        isRecurring={allocation.isRecurring}
                                        onStartTimer={() => handleStartTimer(allocation)}
                                        onEdit={() => { }}
                                        onDelete={() => handleDeleteAllocation(allocation._id)}
                                    />
                                ))}

                                {!allocations || allocations.length === 0 ? (
                                    <div className="text-center py-8 text-gray-600 text-sm">
                                        <p>No time allocations for today</p>
                                        <Button
                                            onClick={() => setShowTaskSelector(true)}
                                            className="mt-4 bg-[#384C5A] hover:bg-[#2c3b46] text-sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Allocation
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showTaskSelector && (
                <TaskSelector
                    tasks={tasks || []}
                    onSelectTask={(data) => {
                        handleAddAllocation(data);
                        setShowTaskSelector(false);
                    }}
                    onClose={() => setShowTaskSelector(false)}
                />
            )}

            {taskModalType && (
                <TaskDetailModal
                    isOpen={!!taskModalType}
                    onClose={() => {
                        setTaskModalType(null);
                        setSelectedTaskId(null);
                    }}
                    onSave={handleSaveTask}
                    task={selectedTask || null}
                    mode={taskModalType}
                />
            )}

            {ideaModalType && (
                <IdeaFormModal
                    isOpen={!!ideaModalType}
                    onClose={() => {
                        setIdeaModalType(null);
                        setSelectedIdeaId(null);
                    }}
                    onSave={handleSaveIdea}
                    idea={selectedIdeaId ? ideas.find((i) => i.id === selectedIdeaId) || null : null}
                    mode={ideaModalType as 'create' | 'edit'}
                />
            )}

            <IdeaDetailModal
                isOpen={isIdeaDetailOpen}
                onClose={() => {
                    setIsIdeaDetailOpen(false);
                    setSelectedIdeaId(null);
                }}
                idea={selectedIdeaId ? ideas.find((i) => i.id === selectedIdeaId) || null : null}
                relatedTasks={relatedTasks}
                onEditIdea={() => {
                    setIsIdeaDetailOpen(false);
                    setIdeaModalType('edit');
                }}
                onArchiveIdea={handleArchiveIdea}
                onCreateTasks={handleCreateMultipleTasks}
                onViewTask={(taskId) => {
                    setSelectedTaskId(taskId);
                    setTaskModalType('edit');
                    setIsIdeaDetailOpen(false);
                }}
            />
        </div>
    );
}
