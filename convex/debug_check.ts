import { query } from "./_generated/server";

export const inspectLastLesson = query({
    handler: async (ctx) => {
        const lessons = await ctx.db.query("lessons").order("desc").take(1);
        if (lessons.length === 0) return "No lessons found";

        const lesson = lessons[0];
        const customer = await ctx.db.get(lesson.customerId);

        const lessonDate = new Date(lesson.start);
        const year = lessonDate.getFullYear();
        const month = lessonDate.getMonth() + 1;

        const budgetIncome = await ctx.db
            .query("budgetIncome")
            .withIndex("by_workspace_period", (q: any) =>
                q.eq("workspaceId", lesson.workspaceId)
                    .eq("year", year)
                    .eq("month", month)
            )
            .first();

        return {
            lesson: {
                id: lesson._id,
                title: lesson.title,
                start: lesson.start,
                end: lesson.end,
                startStr: new Date(lesson.start).toISOString(),
                endStr: new Date(lesson.end).toISOString(),
                durationMs: lesson.end - lesson.start,
                rate: lesson.rate,
                workspaceId: lesson.workspaceId,
            },
            customer: {
                id: customer?._id,
                name: customer?.name,
                defaultHourlyRate: customer?.defaultHourlyRate,
            },
            budgetIncome: budgetIncome,
            expectedRevenue: (customer?.defaultHourlyRate || 0) * ((lesson.end - lesson.start) / (1000 * 60 * 60))
        };
    },
});
export const checkBudgetIncome = query({
    args: {},
    handler: async (ctx) => {
        const income = await ctx.db.query("budgetIncome").collect();
        return income;
    },
});
