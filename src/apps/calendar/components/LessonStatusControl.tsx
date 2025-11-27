
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Check, X, AlertCircle, Clock, FileText } from "lucide-react";
import AttendanceModal from "./AttendanceModal";
import AttendanceReportModal from "./AttendanceReportModal";

interface LessonStatusControlProps {
    lessonId: Id<"lessons">;
    currentStatus: "scheduled" | "attended" | "cancelled_on_time" | "cancelled_late" | "missed";
    start: number;
    type: "online" | "in_person_office" | "in_person_company";
    isTeacher: boolean;
    userId: Id<"users">;
    onStatusChange?: () => void;
}

const ONLINE_CANCELLATION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const OFFLINE_CANCELLATION_WINDOW = 48 * 60 * 60 * 1000; // 48 hours

export default function LessonStatusControl({ lessonId, currentStatus, start, type, isTeacher, userId, onStatusChange }: LessonStatusControlProps) {
    const updateStatus = useMutation((api as any).lessons.updateStatus);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const handleStatusChange = async (status: "attended" | "cancelled_on_time" | "cancelled_late" | "missed") => {
        if (status === "attended") {
            setShowAttendanceModal(true);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await updateStatus({
                lessonId,
                status,
                userId,
            });
            if (onStatusChange) onStatusChange();
        } catch (err: any) {
            setError(err.message || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const now = Date.now();
        const timeUntilStart = start - now;
        const threshold = type === "online" ? ONLINE_CANCELLATION_WINDOW : OFFLINE_CANCELLATION_WINDOW;

        if (timeUntilStart < threshold) {
            // Late cancellation
            if (isTeacher) {
                // Teacher can only mark as cancelled_late (billable) or contact admin?
                // Actually, if it's late, it IS billable (cancelled_late).
                // But if the TEACHER is cancelling because THEY can't make it, it shouldn't be billable.
                // But the system assumes "cancelled_late" is billable to client.
                // For now, we assume this button is for "Client Cancelled".
                // If teacher cancels for themselves, they should probably delete or reassign?
                // Let's stick to the plan: Teacher marks "Cancel" -> System checks policy.
                // If late, we default to cancelled_late (Billable).
                // Maybe ask for confirmation?
                if (confirm("This is a late cancellation and will be billed. Proceed?")) {
                    handleStatusChange("cancelled_late");
                }
            } else {
                // Admin can choose.
                if (confirm("Late cancellation. Mark as Billable (Late) or Non-Billable (On Time)?\nOK = Billable, Cancel = Non-Billable")) {
                    handleStatusChange("cancelled_late");
                } else {
                    handleStatusChange("cancelled_on_time");
                }
            }
        } else {
            // On time
            handleStatusChange("cancelled_on_time");
        }
    };

    if (currentStatus === "attended") {
        return (
            <>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-dark-blue font-medium">
                        <Check className="w-5 h-5" />
                        Attended
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-dark-blue h-8 px-2"
                        onClick={() => setShowReportModal(true)}
                        title="View Attendance Report"
                    >
                        <FileText className="w-4 h-4" />
                    </Button>
                </div>
                <AttendanceReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    lessonId={lessonId}
                />
            </>
        );
    }

    if (currentStatus === "cancelled_on_time" || currentStatus === "cancelled_late") {
        return (
            <div className="flex items-center gap-2 text-slate-500 font-medium">
                <X className="w-5 h-5" />
                {currentStatus === "cancelled_late" ? "Cancelled (Late)" : "Cancelled"}
            </div>
        );
    }

    if (currentStatus === "missed") {
        return (
            <div className="flex items-center gap-2 text-custom-brown font-medium">
                <AlertCircle className="w-5 h-5" />
                Missed
            </div>
        );
    }

    // Scheduled state - show actions
    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    className="bg-dark-blue hover:bg-dark-blue/90 text-white gap-2"
                    onClick={() => handleStatusChange("attended")}
                    disabled={loading}
                >
                    <Check className="w-4 h-4" />
                    Attended
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    <X className="w-4 h-4" />
                    Cancel
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-custom-brown hover:bg-orange-50"
                    onClick={() => handleStatusChange("missed")}
                    disabled={loading}
                    title="Mark as Missed (No Show)"
                >
                    <Clock className="w-4 h-4" />
                </Button>
            </div>

            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

            {/* Helper text for cancellation policy */}
            <p className="text-xs text-gray-500 mt-1">
                Cancellation policy: 24h (Online) / 48h (Offline).
                {isTeacher ? " Late cancellations will be flagged." : " Admins can override."}
            </p>

            <AttendanceModal
                isOpen={showAttendanceModal}
                onClose={() => setShowAttendanceModal(false)}
                lessonId={lessonId}
                userId={userId}
                onSuccess={() => {
                    if (onStatusChange) onStatusChange();
                }}
            />
        </>
    );
}

