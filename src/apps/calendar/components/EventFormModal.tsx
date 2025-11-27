import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CalendarEvent } from "../CalendarApp";
import { useEffect, useState } from "react";

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (event: CalendarEvent) => void;
    event?: CalendarEvent | null;
    selectedDate?: Date | null;
}

export default function EventFormModal({ isOpen, onClose, onSave, onDelete, event, selectedDate }: EventFormModalProps) {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const targetDate = event ? new Date(event.startTime) : selectedDate;
        if (targetDate) {
            setDate(format(targetDate, 'yyyy-MM-dd'));
        }

        if (event) {
            setTitle(event.title);
            setStartTime(format(new Date(event.startTime), 'HH:mm'));
            setEndTime(format(new Date(event.endTime), 'HH:mm'));
        } else {
            setTitle('');
            setStartTime('09:00');
            setEndTime('10:00');
        }
    }, [event, selectedDate, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const [year, month, day] = date.split('-').map(Number);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const newEvent: CalendarEvent = {
            id: event?.id || new Date().toISOString(),
            title,
            startTime: new Date(year, month - 1, day, startHour, startMinute).getTime(),
            endTime: new Date(year, month - 1, day, endHour, endMinute).getTime(),
            googleEventId: event?.googleEventId,
        };
        onSave(newEvent);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{event ? 'Edit Event' : 'Add Event'}</h2>
                <div className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Event Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <div>
                        {event && onDelete && (
                            <Button
                                onClick={() => onDelete(event)}
                                className="bg-brown text-off-white hover:bg-brown/80"
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to format date, assuming date-fns is available in the project
import { format } from 'date-fns';