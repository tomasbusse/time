import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { X, Printer, FileText, User, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AttendanceReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: Id<"lessons">;
}

export default function AttendanceReportModal({ isOpen, onClose, lessonId }: AttendanceReportModalProps) {
    const report = useQuery((api as any).attendanceReports.getAttendanceReportByLesson, { lessonId });
    // We also need lesson details if not fully enriched in report, but report usually has IDs.
    // Let's fetch enriched report if possible, or fetch lesson details separately.
    // The query getAttendanceReportByLesson returns the report document.
    // We might need to fetch students/lesson details to display names.
    // Actually, I created `getEnrichedAttendanceReport` query in backend! Let's use that if it takes lessonId?
    // No, `getEnrichedAttendanceReport` takes `reportId`.
    // So I should first get the report, then get enriched version? Or update backend to get enriched by lesson.
    // Or just fetch lesson/students separately.
    // Let's use `getLessonContext` I created earlier?
    const context = useQuery(api.lessons.getLessonContext, { lessonId });

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    if (!report || !context) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    Loading report...
                </div>
            </div>
        );
    }

    // Prepare data for display
    const presentStudents = context.students.filter(s => s && report.studentsPresent.includes(s._id));
    const absentStudents = context.students.filter(s => s && report.studentsAbsent.includes(s._id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
                {/* Header - Hidden in Print if desired, or styled differently */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 print:bg-white print:border-none print:px-0">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-blue mb-2">Attendance Report</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(context.lesson.start).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {new Date(context.lesson.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                -
                                {new Date(context.lesson.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                {context.customer?.name} {context.group ? `• ${context.group.name}` : ''}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 print:overflow-visible print:p-0 print:mt-4">

                    {/* General Notes */}
                    {report.generalNotes && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> General Notes
                            </h3>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed print:bg-white print:border print:border-slate-200">
                                {report.generalNotes}
                            </div>
                        </div>
                    )}

                    {/* Attendance Summary */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3">
                                Present ({presentStudents.length})
                            </h3>
                            <ul className="space-y-2">
                                {presentStudents.map(s => (
                                    <li key={s!._id} className="flex items-center gap-2 text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {s!.firstName} {s!.lastName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">
                                Absent ({absentStudents.length})
                            </h3>
                            <ul className="space-y-2">
                                {absentStudents.length > 0 ? absentStudents.map(s => (
                                    <li key={s!._id} className="flex items-center gap-2 text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-300"></div>
                                        {s!.firstName} {s!.lastName}
                                    </li>
                                )) : (
                                    <li className="text-slate-400 italic text-sm">None</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Student Progress */}
                    {report.studentProgress && report.studentProgress.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-6 mt-2">
                                Student Progress
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {report.studentProgress.map((prog: any, idx: number) => {
                                    const student = context.students.find(s => s && s._id === prog.studentId);
                                    if (!student) return null;
                                    return (
                                        <div key={idx} className="p-4 border border-slate-200 rounded-xl break-inside-avoid">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-dark-blue">
                                                    {student.firstName} {student.lastName}
                                                </div>
                                                {prog.skillLevel && (
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase">
                                                        {prog.skillLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                {prog.progressNotes}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer for screen only */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end print:hidden">
                    <Button onClick={onClose} variant="ghost">Close</Button>
                </div>
            </div>
        </div>
    );
}
