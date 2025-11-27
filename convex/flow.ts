import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Tasks
export const listTasks = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    // This is not ideal, as it fetches all tasks and filters in memory.
    // For a production app, you'd want to use Convex search indexes for this.
    const tasks = await query.collect();

    return tasks.filter(task => {
      const searchMatch = args.searchTerm
        ? task.title.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(args.searchTerm.toLowerCase())
        : true;

      const priorityMatch = args.priority ? task.priority === args.priority : true;

      const tagsMatch = args.tags && args.tags.length > 0
        ? task.tags?.some((tag: string) => args.tags?.includes(tag))
        : true;

      return searchMatch && priorityMatch && tagsMatch;
    });
  },
});

export const getTasksByIdea = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();
  },
});

export const createTask = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    ideaId: v.optional(v.id("ideas")),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    estimatedHours: v.optional(v.number()),

    // Time allocation fields
    dailyAllocation: v.optional(v.number()),
    weeklyAllocation: v.optional(v.number()),
    monthlyAllocation: v.optional(v.number()),
    yearlyAllocation: v.optional(v.number()),

    // Recurrence fields
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    if (args.status === 'completed' && task.isRecurring && task.recurrenceType) {
      let nextDueDate: Date | null = null;
      const currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();

      if (task.recurrenceType === 'daily') {
        nextDueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + (task.recurrenceInterval || 1)));
      } else if (task.recurrenceType === 'weekly') {
        nextDueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + 7 * (task.recurrenceInterval || 1)));
      } else if (task.recurrenceType === 'monthly') {
        nextDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + (task.recurrenceInterval || 1)));
      } else if (task.recurrenceType === 'yearly') {
        nextDueDate = new Date(currentDueDate.setFullYear(currentDueDate.getFullYear() + (task.recurrenceInterval || 1)));
      }

      if (nextDueDate) {
        if (task.recurrenceEndDate && nextDueDate > new Date(task.recurrenceEndDate)) {
          return; // Stop creating new tasks
        }

        if (task.recurrenceCount && task.recurrenceCount <= 1) {
          await ctx.db.patch(task._id, { isRecurring: false });
          return; // Stop creating new tasks
        }

        const { _id, _creationTime, ...newTaskData } = task;
        await ctx.db.insert("tasks", {
          ...(newTaskData as any),
          status: 'todo',
          dueDate: nextDueDate.toISOString().split('T')[0],
          parentTaskId: task.parentTaskId || task._id,
          recurrenceCount: task.recurrenceCount ? task.recurrenceCount - 1 : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    estimatedHours: v.optional(v.number()),

    // Time allocation fields
    dailyAllocation: v.optional(v.number()),
    weeklyAllocation: v.optional(v.number()),
    monthlyAllocation: v.optional(v.number()),
    yearlyAllocation: v.optional(v.number()),
    timeSpent: v.optional(v.number()),

    // Recurrence fields
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    recurrenceInterval: v.optional(v.number()),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args as any;
    return await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.taskId);
  },
});

// Reorder tasks (move task to different status/position)
export const reorderTasks = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    taskUpdates: v.array(
      v.object({
        taskId: v.id("tasks"),
        status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed"))),
        position: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.taskUpdates) {
      const task = await ctx.db.get(update.taskId);
      if (!task || task.workspaceId !== args.workspaceId) {
        continue;
      }

      const patches: any = { updatedAt: Date.now() };
      if (update.status !== undefined) patches.status = update.status;
      if (update.position !== undefined) patches.position = update.position;

      await ctx.db.patch(update.taskId, patches);
    }
    return true;
  },
});

// Archive task
export const archiveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.taskId, {
      isArchived: args.isArchived,
      updatedAt: Date.now(),
    });
  },
});

// Ideas
export const listIdeas = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const createIdea = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ideas", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    richDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    attachments: v.optional(v.array(v.object({
      url: v.string(),
      name: v.string(),
      type: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const { ideaId, ...updates } = args as any;
    return await ctx.db.patch(ideaId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateIdeaStatus = mutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("converted"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.ideaId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.ideaId);
  },
});

// Get time allocation summary for dashboard
export const getTimeAllocationSummary = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const workspace = await ctx.db.get(args.workspaceId);

    const summary = {
      totalDailyAllocation: 0,
      totalWeeklyAllocation: 0,
      totalMonthlyAllocation: 0,
      totalYearlyAllocation: 0,
      totalTimeSpent: 0,
      tasksWithAllocation: 0,
      completedTasks: 0,
      totalTasks: tasks.length,
      hasActiveTimer: !!workspace?.activeTimerTaskId,
    };

    for (const task of tasks) {
      if (task.dailyAllocation) summary.totalDailyAllocation += task.dailyAllocation;
      if (task.weeklyAllocation) summary.totalWeeklyAllocation += task.weeklyAllocation;
      if (task.monthlyAllocation) summary.totalMonthlyAllocation += task.monthlyAllocation;
      if (task.yearlyAllocation) summary.totalYearlyAllocation += task.yearlyAllocation;
      if (task.timeSpent) summary.totalTimeSpent += task.timeSpent;

      if (task.dailyAllocation || task.weeklyAllocation || task.monthlyAllocation || task.yearlyAllocation) {
        summary.tasksWithAllocation++;
      }

      if (task.status === 'completed') summary.completedTasks++;
    }

    return summary;
  },
});

// Timer Functions
export const startTimer = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    const task = await ctx.db.get(args.taskId);

    if (!workspace || !task) {
      throw new Error("Workspace or task not found");
    }

    if (task.status === 'completed') {
      throw new Error("Cannot start timer on completed task");
    }

    if (workspace.activeTimerTaskId && workspace.activeTimerTaskId !== args.taskId) {
      const activeTask = await ctx.db.get(workspace.activeTimerTaskId);
      if (activeTask && workspace.activeTimerStart) {
        const elapsedMs = Date.now() - workspace.activeTimerStart;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);

        await ctx.db.insert("timeLogged", {
          userId: activeTask.userId,
          workspaceId: args.workspaceId,
          taskId: workspace.activeTimerTaskId,
          sessionStart: workspace.activeTimerStart,
          sessionEnd: Date.now(),
          elapsedTime: elapsedHours,
          logged: true,
          createdAt: Date.now(),
        });

        const currentTimeSpent = activeTask.timeSpent || 0;
        await ctx.db.patch(workspace.activeTimerTaskId, {
          timeSpent: currentTimeSpent + elapsedHours,
          currentSessionStart: undefined,
          updatedAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.workspaceId, {
      activeTimerTaskId: args.taskId,
      activeTimerStart: now,
    });

    await ctx.db.patch(args.taskId, {
      currentSessionStart: now,
      updatedAt: Date.now(),
    });

    return { success: true, startTime: now };
  },
});

export const stopTimer = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);

    if (!workspace || !workspace.activeTimerTaskId || !workspace.activeTimerStart) {
      return { success: false, message: "No active timer" };
    }

    const task = await ctx.db.get(workspace.activeTimerTaskId);
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const elapsedMs = Date.now() - workspace.activeTimerStart;
    const elapsedMinutes = elapsedMs / (1000 * 60);

    if (elapsedMinutes < 1) {
      await ctx.db.patch(args.workspaceId, {
        activeTimerTaskId: undefined,
        activeTimerStart: undefined,
      });

      await ctx.db.patch(workspace.activeTimerTaskId, {
        currentSessionStart: undefined,
        updatedAt: Date.now(),
      });

      return { success: false, message: "Session too short (< 1 minute)" };
    }

    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    await ctx.db.insert("timeLogged", {
      userId: task.userId,
      workspaceId: args.workspaceId,
      taskId: workspace.activeTimerTaskId,
      sessionStart: workspace.activeTimerStart,
      sessionEnd: Date.now(),
      elapsedTime: elapsedHours,
      logged: true,
      createdAt: Date.now(),
    });

    const currentTimeSpent = task.timeSpent || 0;
    await ctx.db.patch(workspace.activeTimerTaskId, {
      timeSpent: currentTimeSpent + elapsedHours,
      currentSessionStart: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.workspaceId, {
      activeTimerTaskId: undefined,
      activeTimerStart: undefined,
    });

    return {
      success: true,
      elapsedHours,
      totalTimeSpent: currentTimeSpent + elapsedHours
    };
  },
});

export const getActiveTimer = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);

    if (!workspace || !workspace.activeTimerTaskId || !workspace.activeTimerStart) {
      return null;
    }

    const task = await ctx.db.get(workspace.activeTimerTaskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task._id,
      taskTitle: task.title,
      startTime: workspace.activeTimerStart,
      elapsedSeconds: Math.floor((Date.now() - workspace.activeTimerStart) / 1000),
    };
  },
});

