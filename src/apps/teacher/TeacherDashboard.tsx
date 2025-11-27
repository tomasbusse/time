import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { Plus, Calendar, Clock, User, MapPin, Video } from "lucide-react";
import LessonModal from "../calendar/components/LessonModal";
import { downloadICS } from "../../lib/calendarExport";

export default function TeacherDashboard() {
    const { workspaceId } = useWorkspace();
    const currentUser = useQuery(api.users.getCurrentUser);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

    // Get start and end of current month for initial view
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

    const lessons = useQuery(api.lessons.listLessons,
        currentUser && workspaceId ? {
            workspaceId,
            teacherId: currentUser._id,
            from: startOfMonth,
            to: endOfMonth
        } : "skip"
    );

    const customers = useQuery(api.customers.listCustomers, workspaceId ? { workspaceId } : "skip");

    if (!currentUser) return <div className="p-8">Loading...</div>;

    // Filter for today's lessons to show count
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    const todaysLessons = lessons?.filter(l => l.start >= todayStart && l.start < todayEnd) || [];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {getGreeting()}, {currentUser.name.split(' ')[0]}!
                            </h1>
                            <p className="text-gray-500 text-lg">
                                You have <span className="font-bold text-blue-600">{todaysLessons.length} lessons</span> scheduled for today.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsLessonModalOpen(true)}
                            className="bg-custom-brown hover:bg-custom-brown/90 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Schedule Lesson
                        </button>
                    </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        Upcoming Lessons
                    </h2>

                    {!lessons ? (
                        <div className="text-center py-12 text-gray-400">Loading lessons...</div>
                    ) : lessons.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 border-dashed">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No lessons scheduled</h3>
                            <p className="text-gray-500">Get started by scheduling your first lesson.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {lessons
                                .sort((a, b) => a.start - b.start)
                                .map((lesson) => {
                                    const customer = customers?.find(c => c._id === lesson.customerId);
                                    const startDate = new Date(lesson.start);
                                    const endDate = new Date(lesson.end);
                                    const isToday = startDate.getTime() >= todayStart && startDate.getTime() < todayEnd;

                                    return (
                                        <div
                                            key={lesson._id}
                                            className={`bg-white p-5 rounded-xl border transition-all hover:shadow-md ${isToday ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
                                                }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-bold shrink-0 ${isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        <span>{startDate.getDate()}</span>
                                                        <span className="text-[10px] uppercase font-normal">
                                                            {startDate.toLocaleDateString('en-US', { month: 'short' })}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{lesson.title}</h3>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="w-4 h-4" />
                                                                {customer?.name || 'Unknown Student'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {(lesson.type || "online") === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                                <span className="capitalize">{((lesson.type || "online") as string).replace(/_/g, ' ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center">
                                                    <button
                                                        onClick={() => {
                                                            downloadICS(
                                                                {
                                                                    title: lesson.title,
                                                                    start: lesson.start,
                                                                    end: lesson.end,
                                                                    type: (lesson.type || "online") as "online" | "in_person_office" | "in_person_company",
                                                                    meetingLink: lesson.meetingLink,
                                                                },
                                                                {
                                                                    name: customer?.name || 'Student',
                                                                    email: customer?.email,
                                                                },
                                                                {
                                                                    name: currentUser.name,
                                                                    email: currentUser.email,
                                                                }
                                                            );
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Add to Calendar"
                                                    >
                                                        <Calendar className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Modal */}
            {isLessonModalOpen && (
                <LessonModal
                    isOpen={isLessonModalOpen}
                    onClose={() => setIsLessonModalOpen(false)}
                    selectedDate={new Date()}
                    existingLesson={null} // Always new lesson
                    hideFinancialFields={true} // Teachers should not see rate/pricing fields
                />
            )}
        </div>
    );
}
