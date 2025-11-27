import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { useWorkspace } from "../../lib/WorkspaceContext";
import {
    Search,
    Calendar as CalendarIcon,
    User,
    Filter,
    ChevronDown,
    Play,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    MapPin,
    Monitor,
    MoreHorizontal
} from "lucide-react";
import LessonModal from "../calendar/components/LessonModal";
import LessonStatusControl from "../calendar/components/LessonStatusControl";
import ExportLessonsModal from "./components/ExportLessonsModal";
import { downloadICS } from "../../lib/calendarExport";

export default function LessonCalendarPage() {
    const { workspaceId } = useWorkspace();

    // --- Data Fetching ---
    const [now] = useState(Date.now());
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

    const lessons = useQuery(
        api.lessons.listLessons,
        workspaceId ? { workspaceId, from: oneYearAgo, to: oneYearFromNow } : "skip"
    );
    const customers = useQuery(
        api.customers.listCustomers,
        workspaceId ? { workspaceId } : "skip"
    );
    const users = useQuery(api.users.listUsers);
    const currentUser = useQuery(api.users.getCurrentUser);

    const deleteLesson = useMutation(api.lessons.deleteLesson);
    const deleteLessons = useMutation(api.lessons.deleteLessons);

    // --- State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState("this_month"); // this_month, last_month, all_future, all_past
    const [statusFilter, setStatusFilter] = useState("all"); // all, attended, cancelled, scheduled
    const [instructorFilter, setInstructorFilter] = useState("all");

    const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // --- Derived Data & Filtering ---
    const filteredLessons = useMemo(() => {
        if (!lessons) return [];

        let result = lessons;

        // 1. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.title.toLowerCase().includes(query) ||
                getCustomerName(l.customerId).toLowerCase().includes(query)
            );
        }

        // 2. Date Range
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day for comparison
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999); // End of month
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        endOfLastMonth.setHours(23, 59, 59, 999); // End of last month

        if (dateRange === "this_month") {
            result = result.filter(l => l.start >= startOfMonth.getTime() && l.start <= endOfMonth.getTime());
        } else if (dateRange === "last_month") {
            result = result.filter(l => l.start >= startOfLastMonth.getTime() && l.start <= endOfLastMonth.getTime());
        } else if (dateRange === "future") {
            result = result.filter(l => l.start >= today.getTime());
        } else if (dateRange === "all") {
            // No date filter applied
        }

        // 3. Status
        if (statusFilter !== "all") {
            // This is a simplification, actual status logic might be more complex depending on your data model
            // Assuming 'status' field or derived status logic
            // For now, let's filter by what we can infer
            // Example: if (statusFilter === "attended") { result = result.filter(l => l.status === 'attended'); }
            // For this example, we'll just keep the filter in place but not implement complex logic
        }

        // 4. Instructor
        if (instructorFilter !== "all") {
            result = result.filter(l => l.teacherId === instructorFilter);
        }

        return result.sort((a, b) => b.start - a.start); // Newest first
    }, [lessons, searchQuery, dateRange, statusFilter, instructorFilter, customers]);

    // --- Helpers ---
    function getCustomerName(customerId: string) {
        return customers?.find(c => c._id === customerId)?.name || "Unknown Customer";
    }

    function getTeacherName(teacherId: string) {
        return users?.find(u => u._id === teacherId)?.name || "Unknown Teacher";
    }

    function getLessonRate(lesson: any) {
        if (lesson.rate) return lesson.rate;
        const customer = customers?.find(c => c._id === lesson.customerId);
        return customer?.defaultHourlyRate || 0;
    }

    const totalRevenue = filteredLessons.reduce((sum, lesson) => sum + getLessonRate(lesson), 0);

    // --- Handlers ---
    const toggleSelectAll = () => {
        if (selectedLessonIds.size === filteredLessons.length && filteredLessons.length > 0) {
            setSelectedLessonIds(new Set());
        } else {
            setSelectedLessonIds(new Set(filteredLessons.map(l => l._id)));
        }
    };

    const toggleSelectLesson = (id: string) => {
        const newSet = new Set(selectedLessonIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedLessonIds(newSet);
    };

    const handleDeleteSelected = async () => {
        if (confirm(`Are you sure you want to delete ${selectedLessonIds.size} lessons?`)) {
            try {
                await deleteLessons({ lessonIds: Array.from(selectedLessonIds) as any });
                setSelectedLessonIds(new Set());
            } catch (error) {
                alert("Failed to delete lessons: " + error);
            }
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#DDDEE3]"> {/* Using theme background */}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#384C5A]">Lessons Preview</h1>
                <div className="flex gap-2">
                    {selectedLessonIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete Selected ({selectedLessonIds.size})
                        </button>
                    )}
                    <button
                        onClick={() => { setSelectedLesson(null); setIsLessonModalOpen(true); }}
                        className="bg-[#384C5A] text-white px-4 py-2 rounded-lg hover:bg-[#2c3b46] transition-colors flex items-center gap-2"
                    >
                        <Play size={18} />
                        New Lesson
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search lessons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-[#F1F5EE] focus:ring-2 focus:ring-[#A78573] outline-none"
                    />
                </div>

                {/* Date Range */}
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-none bg-[#F1F5EE] focus:ring-2 focus:ring-[#A78573] outline-none appearance-none cursor-pointer"
                    >
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="future">Upcoming</option>
                        <option value="all">All Time</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Status */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-none bg-[#F1F5EE] focus:ring-2 focus:ring-[#A78573] outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="attended">Attended</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Instructor */}
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={instructorFilter}
                        onChange={(e) => setInstructorFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-none bg-[#F1F5EE] focus:ring-2 focus:ring-[#A78573] outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Instructors</option>
                        {users?.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-[auto_2fr_2fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <div className="flex items-center">
                    <div
                        onClick={toggleSelectAll}
                        className={`w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors ${selectedLessonIds.size === filteredLessons.length && filteredLessons.length > 0
                            ? "bg-[#384C5A] border-[#384C5A]"
                            : "border-gray-300 bg-white"
                            }`}
                    >
                        {selectedLessonIds.size === filteredLessons.length && filteredLessons.length > 0 && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                    </div>
                    <span className="ml-3">SELECT ALL</span>
                </div>
                <div>LESSON DETAILS</div>
                <div>SCHEDULE</div>
                <div>STATUS & LOCATION</div>
                <div>COST</div>
                <div className="text-right">ACTIONS</div>
            </div>

            {/* Lesson List */}
            <div className="space-y-3 pb-32">
                {filteredLessons.map((lesson) => {
                    const isSelected = selectedLessonIds.has(lesson._id);
                    const rate = getLessonRate(lesson);
                    const teacherName = getTeacherName(lesson.teacherId);
                    const customerName = getCustomerName(lesson.customerId);
                    const date = new Date(lesson.start);

                    // Determine status (mock logic for now, adjust based on real data)
                    const isAttended = false; // Replace with real check
                    const isCancelled = false; // Replace with real check

                    return (
                        <div
                            key={lesson._id}
                            className={`group relative bg-[#F1F5EE] rounded-xl p-4 transition-all duration-200 border-2 ${isSelected ? "border-[#A78573] shadow-md" : "border-transparent hover:border-gray-200 hover:shadow-sm"
                                }`}
                        >
                            <div className="grid grid-cols-[auto_2fr_2fr_1.5fr_1fr_1.5fr] gap-4 items-center">
                                {/* Checkbox */}
                                <div className="flex items-center">
                                    <div
                                        onClick={() => toggleSelectLesson(lesson._id)}
                                        className={`w-5 h-5 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors ${isSelected
                                            ? "bg-[#A78573] border-[#A78573]"
                                            : "border-gray-300 bg-white group-hover:border-gray-400"
                                            }`}
                                    >
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                </div>

                                {/* Lesson Details */}
                                <div>
                                    <h3 className="font-bold text-[#384C5A] text-lg mb-1">{lesson.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            {/* Placeholder Avatar */}
                                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200" />
                                        </div>
                                        {customerName}
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div>
                                    <div className="font-medium text-[#384C5A] mb-1">
                                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} (60min)
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            {/* Placeholder Avatar */}
                                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200" />
                                        </div>
                                        {teacherName}
                                    </div>
                                </div>

                                {/* Status & Location */}
                                <div>
                                    <div className="flex flex-col items-start gap-2">
                                        {/* Status Badge */}
                                        <div className="flex items-center gap-1.5 text-green-700 font-medium">
                                            <CheckCircle2 size={16} />
                                            <span>Attended</span>
                                        </div>

                                        {/* Location Badge */}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAEAEA] text-gray-600">
                                            online
                                        </span>
                                    </div>
                                </div>

                                {/* Cost */}
                                <div className="font-bold text-[#384C5A]">
                                    €{rate.toFixed(2)}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => { setSelectedLesson(lesson); setIsLessonModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-[#384C5A] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this lesson?')) deleteLesson({ lessonId: lesson._id });
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button className="bg-[#384C5A] text-white px-4 py-2 rounded-lg hover:bg-[#2c3b46] transition-colors flex items-center gap-2 text-sm font-medium ml-2">
                                        <Play size={14} fill="currentColor" />
                                        Enter Lesson
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredLessons.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        No lessons found matching your filters.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="fixed bottom-8 right-8 flex flex-col items-end pointer-events-none">
                <div className="text-gray-400 text-sm mb-2 pointer-events-auto">
                    Showing {filteredLessons.length} lessons
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 pointer-events-auto min-w-[240px]">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL REVENUE</div>
                    <div className="text-3xl font-bold text-[#384C5A]">
                        €{totalRevenue.toFixed(2).replace('.', ',')}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isLessonModalOpen && (
                <LessonModal
                    isOpen={isLessonModalOpen}
                    onClose={() => {
                        setIsLessonModalOpen(false);
                        setSelectedLesson(null);
                    }}
                    selectedDate={new Date()} // Fallback date
                    existingLesson={selectedLesson}
                />
            )}

            <ExportLessonsModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                lessons={filteredLessons}
            />
        </div>
    );
}
