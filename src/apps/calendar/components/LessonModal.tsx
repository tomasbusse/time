import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { X, Calendar } from "lucide-react";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import LessonStatusControl from "./LessonStatusControl";
import { downloadICS } from "../../../lib/calendarExport";

interface LessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate?: Date | null;
    existingLesson?: any; // Type this properly if possible
    onSave?: () => void;
    hideFinancialFields?: boolean; // Hide rate/price fields (for teacher view)
}

export default function LessonModal({ isOpen, onClose, selectedDate, existingLesson, onSave, hideFinancialFields = false }: LessonModalProps) {
    const { workspaceId } = useWorkspace();
    const currentUser = useQuery(api.users.getCurrentUser);
    const customers = useQuery((api as any).customers.listCustomers, workspaceId ? { workspaceId } : "skip");
    const createLesson = useMutation((api as any).lessons.createLesson);
    const updateLesson = useMutation((api as any).lessons.updateLesson);
    const reassignLesson = useMutation((api as any).lessons.reassignLesson);
    const users = useQuery(api.users.listUsers);

    // We need to fetch students and groups based on selected customer
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const students = useQuery((api as any).students.listStudents, selectedCustomerId && workspaceId ? { customerId: selectedCustomerId as Id<"customers">, workspaceId } : "skip");
    const groups = useQuery((api as any).groups.listGroups, selectedCustomerId && workspaceId ? { customerId: selectedCustomerId as Id<"customers">, workspaceId } : "skip");

    const [formData, setFormData] = useState({
        title: "",
        start: "",
        end: "",
        type: "online" as "online" | "in_person_office" | "in_person_company",
        studentId: "",
        groupId: "",
        meetingLink: "",
        rate: "",
    });

    const [newTeacherId, setNewTeacherId] = useState<string>("");
    const [customerSearch, setCustomerSearch] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<number>(60); // Default 1 hour
    const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [savedLessonData, setSavedLessonData] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setShowSuccess(false);
            setSavedLessonData(null);

            if (existingLesson) {
                const duration = Math.round((existingLesson.end - existingLesson.start) / 60000); // Convert ms to minutes
                setDurationMinutes(duration);
                // Check if it's a standard duration
                const standardDurations = [30, 60, 90, 120, 150, 180];
                setIsCustomDuration(!standardDurations.includes(duration));

                setFormData({
                    title: existingLesson.title || "",
                    start: new Date(existingLesson.start).toISOString().slice(0, 16),
                    end: new Date(existingLesson.end).toISOString().slice(0, 16),
                    type: existingLesson.type || "online",
                    studentId: existingLesson.studentId || "",
                    groupId: existingLesson.groupId || "",
                    meetingLink: existingLesson.meetingLink || "",
                    rate: existingLesson.rate ? String(existingLesson.rate) : "",
                });
                setSelectedCustomerId(existingLesson.customerId || "");
                setNewTeacherId(existingLesson.teacherId || "");
                setCustomerSearch("");
            } else {
                // Default new lesson
                const start = selectedDate ? new Date(selectedDate) : new Date();
                start.setHours(10, 0, 0, 0); // Default 10 AM
                const end = new Date(start);
                end.setHours(11, 0, 0, 0); // Default 1 hour duration

                setDurationMinutes(60); // Reset to 1 hour
                setIsCustomDuration(false);

                setFormData({
                    title: "",
                    start: start.toISOString().slice(0, 16),
                    end: end.toISOString().slice(0, 16),
                    type: "online",
                    studentId: "",
                    groupId: "",
                    meetingLink: "",
                    rate: "",
                });
                setSelectedCustomerId("");
                setNewTeacherId("");
                setCustomerSearch("");
            }
        }
    }, [isOpen, existingLesson, selectedDate]);

    // Calculate end time when start time or duration changes
    useEffect(() => {
        if (formData.start) {
            const startDate = new Date(formData.start);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            const endString = endDate.toISOString().slice(0, 16);
            if (formData.end !== endString) {
                setFormData(prev => ({ ...prev, end: endString }));
            }
        }
    }, [formData.start, durationMinutes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting lesson form", { formData, selectedCustomerId, currentUser });

        if (!selectedCustomerId) {
            alert("Please select a customer");
            return;
        }

        // Fallback to first user if currentUser is null (for dev/testing)
        let effectiveUser = currentUser;
        if (!effectiveUser && users && users.length > 0) {
            console.warn("No current user found, falling back to first available user:", users[0]);
            effectiveUser = users[0];
        }

        if (!effectiveUser) {
            console.error("No current user found and no fallback users available");
            alert("You must be logged in or have users in the system to create a lesson.");
            return;
        }

        // Validation relaxed: individual customers might not have student/group
        // if (!formData.studentId && !formData.groupId) {
        //     alert("Please select either a Student or a Group");
        //     return;
        // }

        try {
            // Calculate end time explicitly from start + duration to avoid race conditions
            const startTime = new Date(formData.start).getTime();
            const endTime = startTime + (durationMinutes * 60000);

            const payload = {
                customerId: selectedCustomerId as Id<"customers">,
                start: startTime,
                end: endTime,
                type: formData.type,
                studentId: formData.studentId ? (formData.studentId as Id<"students">) : undefined,
                groupId: formData.groupId ? (formData.groupId as Id<"studentGroups">) : undefined,
                title: formData.title || "Lesson",
                teacherId: effectiveUser._id, // Use effectiveUser instead of currentUser
                workspaceId: workspaceId!,
                meetingLink: formData.meetingLink || undefined,
                rate: formData.rate ? parseFloat(formData.rate) : undefined,
            };

            console.log("Payload:", payload);

            if (existingLesson) {
                // Wait, updateLesson args are specific. I need to pass only allowed args.
                // Let's fix this call.
                await updateLesson({
                    lessonId: existingLesson._id,
                    title: payload.title,
                    start: payload.start,
                    end: payload.end,
                    type: payload.type,
                    meetingLink: payload.meetingLink,
                    rate: payload.rate,
                });
                if (onSave) onSave();
                onClose();
            } else {
                await createLesson(payload);
                // Show success state for new lessons (calendar export option)
                const customer = customers?.find((c: any) => c._id === selectedCustomerId);
                setSavedLessonData({
                    lesson: payload,
                    customer,
                    teacher: effectiveUser,
                });
                setShowSuccess(true);
            }
        } catch (error) {
            console.error("Failed to save lesson:", error);
            alert("Failed to save lesson");
        }
    };

    const handleReassign = async () => {
        if (!existingLesson || !newTeacherId) return;
        try {
            await reassignLesson({
                lessonId: existingLesson._id,
                newTeacherId: newTeacherId as Id<"users">,
            });
            alert("Lesson reassigned successfully.");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Failed to reassign lesson:", error);
            alert("Failed to reassign lesson");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-dark-blue">
                        {existingLesson ? "Edit Lesson" : "Schedule Lesson"}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {showSuccess && savedLessonData ? (
                        // Success state with calendar export option
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center">
                                <div className="rounded-full bg-green-100 p-3">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">Lesson Created!</h4>
                                <p className="text-sm text-gray-600">
                                    {savedLessonData.lesson.title} with {savedLessonData.customer?.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(savedLessonData.lesson.start).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        if (savedLessonData) {
                                            downloadICS(
                                                {
                                                    title: savedLessonData.lesson.title,
                                                    start: savedLessonData.lesson.start,
                                                    end: savedLessonData.lesson.end,
                                                    type: savedLessonData.lesson.type,
                                                    meetingLink: savedLessonData.lesson.meetingLink,
                                                },
                                                {
                                                    name: savedLessonData.customer?.name || 'Customer',
                                                    email: savedLessonData.customer?.email,
                                                },
                                                {
                                                    name: savedLessonData.teacher?.name || 'Teacher',
                                                    email: savedLessonData.teacher?.email,
                                                }
                                            );
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Add to Calendar
                                </button>

                                <button
                                    onClick={() => {
                                        if (onSave) onSave();
                                        onClose();
                                    }}
                                    className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Regular form
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="Lesson Title"
                                />
                            </div>

                            {/* Customer Selection - Searchable */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search customers..."
                                        value={customerSearch || (selectedCustomerId ? customers?.find((c: any) => c._id === selectedCustomerId)?.name || "" : "")}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            // Show dropdown when typing
                                            const dropdown = document.getElementById('lesson-customer-dropdown');
                                            if (dropdown) dropdown.classList.remove('hidden');
                                        }}
                                        onFocus={() => {
                                            const dropdown = document.getElementById('lesson-customer-dropdown');
                                            if (dropdown) dropdown.classList.remove('hidden');
                                        }}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                        disabled={!!existingLesson}
                                    />
                                    {selectedCustomerId && !customerSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomerId("");
                                                setFormData({ ...formData, studentId: "", groupId: "" });
                                                setCustomerSearch("");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            disabled={!!existingLesson}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Dropdown */}
                                    {!existingLesson && (
                                        <div
                                            id="lesson-customer-dropdown"
                                            className="hidden absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                            onBlur={(e) => {
                                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                    e.currentTarget.classList.add('hidden');
                                                }
                                            }}
                                        >
                                            {(() => {
                                                const searchLower = customerSearch.toLowerCase();
                                                // Filter to show only active customers
                                                const activeCustomers = customers?.filter((customer: any) => customer.isActive !== false) || [];
                                                const filteredCustomers = activeCustomers.filter((customer: any) =>
                                                    !searchLower ||
                                                    customer.name.toLowerCase().includes(searchLower) ||
                                                    customer.customerNumber?.toLowerCase().includes(searchLower)
                                                );

                                                return filteredCustomers.map((customer: any) => (
                                                    <button
                                                        key={customer._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCustomerId(customer._id);
                                                            setFormData({ ...formData, studentId: "", groupId: "" });
                                                            setCustomerSearch("");
                                                            document.getElementById('lesson-customer-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                                                    >
                                                        <div className="font-medium text-slate-800">{customer.name}</div>
                                                        {customer.customerNumber && (
                                                            <div className="text-xs text-slate-500">#{customer.customerNumber}</div>
                                                        )}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Student or Group Selection */}
                            {selectedCustomerId && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Student (Optional)</label>
                                        <select
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value, groupId: "" })}
                                            className="w-full border rounded px-3 py-2"
                                            disabled={!!formData.groupId}
                                        >
                                            <option value="">None</option>
                                            {students?.map((s: any) => (
                                                <option key={s._id} value={s._id}>
                                                    {s.firstName} {s.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Group (Optional)</label>
                                        <select
                                            value={formData.groupId}
                                            onChange={(e) => setFormData({ ...formData, groupId: e.target.value, studentId: "" })}
                                            className="w-full border rounded px-3 py-2"
                                            disabled={!!formData.studentId}
                                        >
                                            <option value="">None</option>
                                            {groups?.map((g: any) => (
                                                <option key={g._id} value={g._id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start}
                                        onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration</label>
                                    {!isCustomDuration ? (
                                        <select
                                            value={durationMinutes}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                if (value === -1) {
                                                    setIsCustomDuration(true);
                                                } else {
                                                    setDurationMinutes(value);
                                                }
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                            required
                                        >
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="90">1.5 hours</option>
                                            <option value="120">2 hours</option>
                                            <option value="150">2.5 hours</option>
                                            <option value="180">3 hours</option>
                                            <option value="-1">Custom...</option>
                                        </select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={durationMinutes}
                                                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                                                className="w-full border rounded px-3 py-2"
                                                placeholder="Minutes"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomDuration(false)}
                                                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        End: {formData.end ? new Date(formData.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="online"
                                            checked={formData.type === "online"}
                                            onChange={() => setFormData({ ...formData, type: "online" })}
                                            className="mr-2"
                                        />
                                        Online
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="in_person_office"
                                            checked={formData.type === "in_person_office"}
                                            onChange={() => setFormData({ ...formData, type: "in_person_office" })}
                                            className="mr-2"
                                        />
                                        In Person (Office)
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="in_person_company"
                                            checked={formData.type === "in_person_company"}
                                            onChange={() => setFormData({ ...formData, type: "in_person_company" })}
                                            className="mr-2"
                                        />
                                        In Person (Company)
                                    </label>
                                </div>
                            </div>

                            {/* Meeting Link */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Meeting Link (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                />
                                <p className="text-xs text-gray-500 mt-1">For online lessons: Zoom, Google Meet, Teams, etc.</p>
                            </div>

                            {/* Rate (Admin Only) */}
                            {!hideFinancialFields && (currentUser?.isAdmin || currentUser?.role === 'admin' || (users && users.length > 0 && (users[0].isAdmin || users[0].role === 'admin'))) && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fixed Price (€) - Overrides Hourly Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.rate}
                                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="e.g., 60.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Set a fixed price for this lesson. Leave empty to use customer's hourly rate.</p>
                                </div>
                            )}

                            {/* Status Control (Only for existing lessons) */}
                            {existingLesson && currentUser && (
                                <div className="border-t pt-4 mt-4">
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <LessonStatusControl
                                        lessonId={existingLesson._id}
                                        currentStatus={existingLesson.status}
                                        start={existingLesson.start}
                                        type={existingLesson.type}
                                        isTeacher={currentUser.role === "teacher"}
                                        userId={currentUser._id}
                                        onStatusChange={onSave}
                                    />
                                </div>
                            )}

                            {/* Reassign (Admin Only) */}
                            {existingLesson && (currentUser?.isAdmin || currentUser?.role === 'admin') && (
                                <div className="border-t pt-4 mt-4">
                                    <label className="block text-sm font-medium mb-2">Reassign Teacher</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={newTeacherId}
                                            onChange={(e) => setNewTeacherId(e.target.value)}
                                            className="flex-1 border rounded px-3 py-2"
                                        >
                                            <option value="">Select Teacher</option>
                                            {users?.map((u: any) => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button type="button" variant="outline" onClick={handleReassign}>
                                            Reassign
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                                <Button variant="outline" onClick={onClose} type="button">
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {existingLesson ? "Update Lesson" : "Schedule Lesson"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div >
        </div >
    );
}
