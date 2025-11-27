import { useState } from "react";
import { X, Download, Calendar, Check } from "lucide-react";

interface ExportLessonsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportLessonsModal({ isOpen, onClose }: ExportLessonsModalProps) {
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split("T")[0],
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    const [exportFormat, setExportFormat] = useState<"google" | "ical">("google");
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    // We would use an action here to generate the export
    // const exportLessons = useAction(api.lessons.exportLessons);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Simulate export delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (exportFormat === "ical") {
                // Mock iCal download
                const element = document.createElement("a");
                const file = new Blob(["BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Time App//NONSGML v1.0//EN\nEND:VCALENDAR"], { type: 'text/calendar' });
                element.href = URL.createObjectURL(file);
                element.download = "lessons.ics";
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
            } else {
                // Mock Google Calendar export
                // In a real app, this would trigger an OAuth flow or API call
            }

            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export lessons");
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-dark-blue">Export Lessons</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Date Range */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">From</label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-custom-brown focus:border-custom-brown"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-custom-brown focus:border-custom-brown"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Export Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setExportFormat("google")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${exportFormat === "google"
                                    ? "border-custom-brown bg-orange-50 text-custom-brown"
                                    : "border-gray-100 hover:border-gray-200 text-gray-600"
                                    }`}
                            >
                                <Calendar className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">Google Calendar</span>
                            </button>
                            <button
                                onClick={() => setExportFormat("ical")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${exportFormat === "ical"
                                    ? "border-custom-brown bg-orange-50 text-custom-brown"
                                    : "border-gray-100 hover:border-gray-200 text-gray-600"
                                    }`}
                            >
                                <Download className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">iCal File</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting || exportSuccess}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${exportSuccess
                            ? "bg-green-600"
                            : "bg-dark-blue hover:bg-opacity-90"
                            }`}
                    >
                        {isExporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Exporting...
                            </>
                        ) : exportSuccess ? (
                            <>
                                <Check className="w-5 h-5" />
                                Exported Successfully
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Export Lessons
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
