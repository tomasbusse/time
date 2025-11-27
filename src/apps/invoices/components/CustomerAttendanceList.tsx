import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { Calendar, Printer, Download, Search } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { AttendanceListPDF } from "./AttendanceListPDF";

export default function CustomerAttendanceList({ customerId }: { customerId: Id<"customers"> }) {
    const { workspaceId } = useWorkspace();

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(endOfMonth);

    // Convert dates to timestamps for query
    const from = new Date(startDate).getTime();
    const to = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1; // End of day

    const lessons = useQuery(api.lessons.listLessons,
        workspaceId && customerId ? {
            workspaceId,
            customerId,
            from,
            to
        } : "skip"
    );

    const students = useQuery(api.students.listStudents,
        workspaceId && customerId ? { workspaceId, customerId } : "skip"
    );

    const groups = useQuery(api.groups.listGroups,
        workspaceId && customerId ? { workspaceId, customerId } : "skip"
    );

    const reports = useQuery(api.attendanceReports.listAttendanceReportsByCustomer,
        customerId ? { customerId, from, to } : "skip"
    );

    const settings = useQuery(api.companySettings.getSettings, workspaceId ? { workspaceId } : "skip");
    const customer = useQuery(api.customers.getCustomer, { id: customerId });

    // Helper to get student/group names
    const getTargetName = (lesson: any) => {
        if (lesson.groupId) {
            const group = groups?.find(g => g._id === lesson.groupId);
            return group ? `Group: ${group.name}` : "Unknown Group";
        }
        if (lesson.studentId) {
            const student = students?.find(s => s._id === lesson.studentId);
            return student ? `${student.firstName} ${student.lastName}` : "Unknown Student";
        }
        return "-";
    };

    // Calculate stats
    const stats = lessons?.reduce((acc, lesson) => {
        const duration = (lesson.end - lesson.start) / (1000 * 60 * 60);
        acc.totalHours += duration;

        if (lesson.status === 'attended') acc.attendedHours += duration;
        if (lesson.status === 'cancelled_late') acc.cancelledLateHours += duration;
        if (lesson.status === 'cancelled_on_time') acc.cancelledOnTimeHours += duration;

        return acc;
    }, {
        totalHours: 0,
        attendedHours: 0,
        cancelledLateHours: 0,
        cancelledOnTimeHours: 0
    });

    // Sort lessons by Group Name (or Student Name if no group), then by Date
    const sortedLessons = lessons ? [...lessons].sort((a, b) => {
        const nameA = getTargetName(a).toLowerCase();
        const nameB = getTargetName(b).toLowerCase();

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        // If names are equal (same group/student), sort by date
        return a.start - b.start;
    }) : [];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                    />
                </div>
                <div className="flex-1"></div>

                {lessons && customer && settings && groups && students && reports ? (
                    <PDFDownloadLink
                        document={
                            <AttendanceListPDF
                                lessons={lessons}
                                customer={customer}
                                settings={settings}
                                startDate={startDate}
                                groups={groups}
                                students={students}
                                reports={reports}
                            />
                        }
                        fileName={`Teilnehmerliste_${customer.companyName || customer.name}_${startDate}.pdf`}
                        className="px-4 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                    >
                        {({ loading }) => (
                            <>
                                <Download size={16} />
                                {loading ? 'Generating PDF...' : 'Download PDF'}
                            </>
                        )}
                    </PDFDownloadLink>
                ) : (
                    <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg flex items-center gap-2 text-sm font-medium cursor-not-allowed">
                        <Download size={16} /> Loading...
                    </button>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Hours</div>
                    <div className="text-2xl font-bold text-[#384C5A]">{stats?.totalHours.toFixed(2) || "0.00"}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Attended</div>
                    <div className="text-2xl font-bold text-green-600">{stats?.attendedHours.toFixed(2) || "0.00"}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Cancelled (Late)</div>
                    <div className="text-2xl font-bold text-orange-600">{stats?.cancelledLateHours.toFixed(2) || "0.00"}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Cancelled (On Time)</div>
                    <div className="text-2xl font-bold text-gray-400">{stats?.cancelledOnTimeHours.toFixed(2) || "0.00"}</div>
                </div>
            </div>

            {/* List (Screen View) */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Student / Group</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedLessons?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    No lessons found for this period.
                                </td>
                            </tr>
                        ) : (
                            sortedLessons?.map((lesson) => {
                                const start = new Date(lesson.start);
                                const end = new Date(lesson.end);
                                const duration = (lesson.end - lesson.start) / (1000 * 60 * 60);

                                return (
                                    <tr key={lesson._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-[#384C5A]">
                                            {start.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-3 text-gray-800">
                                            {getTargetName(lesson)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                                                ${lesson.status === 'attended' ? 'bg-green-100 text-green-700' :
                                                    lesson.status === 'cancelled_late' ? 'bg-orange-100 text-orange-700' :
                                                        lesson.status === 'cancelled_on_time' ? 'bg-gray-100 text-gray-600' :
                                                            lesson.status === 'missed' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-50 text-blue-600'
                                                }`}>
                                                {lesson.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-gray-600">
                                            {duration.toFixed(2)} h
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
