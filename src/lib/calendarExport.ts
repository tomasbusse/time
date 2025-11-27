/**
 * Calendar Export Utility
 * Generates .ics (iCalendar) files for importing lessons into calendar apps
 */

interface LessonData {
    title: string;
    start: number; // Unix timestamp in milliseconds
    end: number;
    type: 'online' | 'in_person_office' | 'in_person_company';
    meetingLink?: string;
    notes?: string;
}

interface CustomerData {
    name: string;
    email?: string;
}

interface TeacherData {
    name: string;
    email?: string;
}

/**
 * Formats a date to iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates a unique identifier for the iCalendar event
 */
function generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}@lessons.app`;
}

/**
 * Escapes special characters for iCalendar format
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Generates an .ics (iCalendar) file content for a lesson
 */
export function generateICS(
    lesson: LessonData,
    customer: CustomerData,
    teacher: TeacherData
): string {
    const now = formatICalDate(Date.now());
    const start = formatICalDate(lesson.start);
    const end = formatICalDate(lesson.end);
    const uid = generateUID();

    // Build event title
    const summary = escapeICalText(`${lesson.title} - ${customer.name}`);

    // Build description
    let description = `Lesson Type: ${lesson.type.replace(/_/g, ' ')}\\n`;
    description += `Customer: ${customer.name}\\n`;
    if (lesson.notes) {
        description += `Notes: ${escapeICalText(lesson.notes)}\\n`;
    }

    // Build location
    let location = '';
    if (lesson.type === 'online' && lesson.meetingLink) {
        location = escapeICalText(lesson.meetingLink);
        description += `Meeting Link: ${lesson.meetingLink}\\n`;
    } else if (lesson.type === 'in_person_office') {
        location = 'Office';
    } else if (lesson.type === 'in_person_company') {
        location = 'Company Location';
    }

    // Build attendees
    const attendees: string[] = [];
    if (customer.email) {
        attendees.push(`ATTENDEE;CN=${escapeICalText(customer.name)};RSVP=TRUE:mailto:${customer.email}`);
    }

    // Build organizer
    let organizer = '';
    if (teacher.email) {
        organizer = `ORGANIZER;CN=${escapeICalText(teacher.name)}:mailto:${teacher.email}`;
    }

    // Build the .ics content
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Lesson Manager//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
    ];

    if (location) {
        lines.push(`LOCATION:${location}`);
    }

    if (organizer) {
        lines.push(organizer);
    }

    attendees.forEach(attendee => {
        lines.push(attendee);
    });

    lines.push(
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    );

    return lines.join('\r\n');
}

/**
 * Triggers a download of an .ics file in the browser
 */
export function downloadICS(
    lesson: LessonData,
    customer: CustomerData,
    teacher: TeacherData
): void {
    const icsContent = generateICS(lesson, customer, teacher);

    // Create a Blob with the .ics content
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    // Generate filename: "lesson-CustomerName-YYYYMMDD.ics"
    const date = new Date(lesson.start);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const customerName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `lesson-${customerName}-${dateStr}.ics`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
}
