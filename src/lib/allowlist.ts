// Allowed email addresses - add or remove emails here
export const ALLOWED_EMAILS = [
    'tomas@englisch-lehrer.com',
    // Add more emails below:
    // 'another@example.com',
];

export function isEmailAllowed(email: string | null | undefined): boolean {
    if (!email) return false;
    return ALLOWED_EMAILS.includes(email.toLowerCase());
}
