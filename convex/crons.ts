import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run on the 1st of every month at 00:00 UTC
crons.monthly(
    "generate-monthly-invoices",
    { day: 1, hourUTC: 1, minuteUTC: 0 },
    (internal as any).invoices.runMonthlyInvoiceGenerationAction
);

export default crons;
