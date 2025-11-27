import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { X, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: Id<"lessons">;
    userId: Id<"users">;
    onSuccess: () => void;
}

export default function AttendanceModal({ isOpen, onClose, lessonId, userId, onSuccess }: AttendanceModalProps) {
    const studentsData = useQuery((api as any).lessons.getLessonStudents, { lessonId });
    // Cast api to any to avoid type error if generation is lagging
    const createReport = useMutation((api as any).attendanceReports.createAttendanceReport);
    const updateLessonStatus = useMutation(api.lessons.updateStatus);

    const [presentStudents, setPresentStudents] = useState<Set<string>>(new Set());
    const [generalNotes, setGeneralNotes] = useState("");
    const [studentProgress, setStudentProgress] = useState<Record<string, { notes: string; skillLevel?: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize all students as present by default when data loads
    useEffect(() => {
        if (studentsData && (studentsData as any).students) {
            const allIds = new Set<string>((studentsData as any).students.map((s: any) => String(s._id)));
            setPresentStudents(allIds);
        }
    }, [studentsData]);

    if (!isOpen) return null;
    if (!studentsData) return null; // Wait for data to load

    const toggleAttendance = (studentId: string) => {
        const newPresent = new Set(presentStudents);
        if (newPresent.has(studentId)) {
            newPresent.delete(studentId);
        } else {
            newPresent.add(studentId);
        }
        setPresentStudents(newPresent);
    };

    const updateStudentNote = (studentId: string, notes: string) => {
        setStudentProgress(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], notes }
        }));
    };

    const updateStudentSkill = (studentId: string, skillLevel: string) => {
        setStudentProgress(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], skillLevel }
        }));
    };

    const handleSubmit = async () => {
        if (!studentsData) return;
        setIsSubmitting(true);
        try {
            const data = studentsData as any;
            const presentIds = Array.from(presentStudents) as Id<"students">[];
            const absentIds = data.students
                .filter((s: any) => !presentStudents.has(s._id))
                .map((s: any) => s._id);

            const progressData = Object.entries(studentProgress).map(([studentId, data]) => ({
                studentId: studentId as Id<"students">,
                progressNotes: data.notes,
                skillLevel: data.skillLevel as any
            })).filter(p => presentStudents.has(p.studentId)); // Only save progress for present students

            // 1. Create Report
            await createReport({
                workspaceId: data.lesson.workspaceId,
                lessonId,
                customerId: data.lesson.customerId,
                groupId: data.group?._id,
                studentsPresent: presentIds,
                studentsAbsent: absentIds,
                generalNotes,
                studentProgress: progressData,
                createdBy: userId
            });

            // 2. Update Lesson Status
            await updateLessonStatus({
                lessonId,
                status: "attended",
                userId,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to submit attendance:", error);
            alert("Failed to submit attendance. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-dark-blue">Mark Attendance</h2>
                        <p className="text-sm text-slate-500">
                            {(studentsData as any)?.lesson?.title || 'Lesson'} • {new Date((studentsData as any)?.lesson?.start || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Students List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Students
                        </h3>

                        {!studentsData ? (
                            <div className="text-center py-8 text-slate-400">Loading students...</div>
                        ) : !(studentsData as any).students || (studentsData as any).students.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No students assigned to this lesson.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(studentsData as any).students.map((student: any) => {
                                    const isPresent = presentStudents.has(student._id);
                                    return (
                                        <div key={student._id} className={`border rounded-xl transition-all ${isPresent ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isPresent ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                                        {student.firstName[0]}{student.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className={`font-medium ${isPresent ? 'text-dark-blue' : 'text-slate-500'}`}>
                                                            {student.firstName} {student.lastName}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {isPresent ? 'Present' : 'Absent'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={isPresent}
                                                        onChange={() => toggleAttendance(student._id)}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                </label>
                                            </div>

                                            {/* Progress Section - Only if Present */}
                                            {isPresent && (
                                                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="pl-12 space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-medium text-slate-500">Progress Note</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Mastered past tense..."
                                                                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                                    value={studentProgress[student._id]?.notes || ""}
                                                                    onChange={(e) => updateStudentNote(student._id, e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-medium text-slate-500">Skill Level</label>
                                                                <select
                                                                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                                                                    value={studentProgress[student._id]?.skillLevel || ""}
                                                                    onChange={(e) => updateStudentSkill(student._id, e.target.value)}
                                                                >
                                                                    <option value="">Select Level...</option>
                                                                    <option value="beginner">Beginner</option>
                                                                    <option value="intermediate">Intermediate</option>
                                                                    <option value="advanced">Advanced</option>
                                                                    <option value="proficient">Proficient</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* General Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> General Lesson Notes
                        </h3>
                        <textarea
                            className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-custom-brown/20 focus:border-custom-brown resize-none text-sm"
                            placeholder="Summary of the lesson, topics covered, homework assigned..."
                            value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !studentsData}
                        className="bg-dark-blue hover:bg-dark-blue/90 text-white min-w-[120px]"
                    >
                        {isSubmitting ? "Saving..." : "Save Report"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
