import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("aiSettings").first();
  },
});

export const updateSettings = mutation({
  args: {
    provider: v.string(),
    apiKey: v.optional(v.string()),
    model: v.string(),
    promptTemplate: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("aiSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("aiSettings", {
        ...args,
        apiKey: args.apiKey || "",
        createdAt: Date.now(),
      });
    }
  },
});

export const setWritingStatus = mutation({
  args: { isWriting: v.boolean() },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("aiSettings").first();
    if (settings) {
      await ctx.db.patch(settings._id, {
        isWriting: args.isWriting ? Date.now() : undefined,
      });
    }
  },
});

export const getResearchTopics = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("researchTopics").order("desc").collect();
  },
});

export const addResearchTopic = mutation({
  args: { topic: v.string(), categoryId: v.optional(v.id("categories")) },
  handler: async (ctx, args) => {
    await ctx.db.insert("researchTopics", {
      topic: args.topic,
      categoryId: args.categoryId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const deleteResearchTopic = mutation({
  args: { id: v.id("researchTopics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const markTopicAsProcessed = mutation({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const pendingTopic = await ctx.db
      .query("researchTopics")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.eq(q.field("topic"), args.topic))
      .first();

    if (pendingTopic) {
      await ctx.db.patch(pendingTopic._id, { status: "processed" });
    }
  },
});

export const clearAllPendingTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("researchTopics")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    for (const topic of pending) {
      await ctx.db.delete(topic._id);
    }
  },
});

export const getSchedule = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("aiSchedule").collect();
  },
});

export const updateScheduleV2 = mutation({
  args: {
    id: v.optional(v.id("aiSchedule")),
    daysOfWeek: v.array(v.number()),
    time: v.string(),
    timezone: v.string(),
    isActive: v.boolean(),
    topicsToResearch: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
    } else {
      await ctx.db.insert("aiSchedule", {
        ...data,
        lastRun: 0,
      });
    }
  },
});

export const getPendingSchedules = query({
  args: {},
  handler: async (ctx) => {
    const nowTs = Date.now();
    const now = new Date(nowTs);

    const schedules = await ctx.db
      .query("aiSchedule")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Map common shorthands to IANA names
    const tzMap: Record<string, string> = {
      UTC: "UTC",
      "GMT+1": "Europe/London",
      EST: "America/New_York",
      PST: "America/Los_Angeles",
      CET: "Europe/Paris",
      IST: "Asia/Kolkata",
    };

    return schedules.filter((s) => {
      const ianaTz = tzMap[s.timezone] || "UTC";

      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: ianaTz,
          hour12: false,
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });

        const parts = formatter.formatToParts(now);
        const partsMap: Record<string, string> = {};
        parts.forEach((p) => (partsMap[p.type] = p.value));

        // Get day name for accurate day mapping
        const dayFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: ianaTz,
          weekday: "long",
        });
        const dayName = dayFormatter.format(now);
        const dayMap: Record<string, number> = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const currentLocalDay = dayMap[dayName];
        const currentLocalHour = parseInt(partsMap.hour);
        const currentLocalMinute = parseInt(partsMap.minute);

        const [scheduledHour, scheduledMinute] = s.time.split(":").map(Number);

        // Check if current local day is in scheduled days
        if (!s.daysOfWeek.includes(currentLocalDay)) return false;

        // Check if it's time (within a 15 min window)
        const scheduledTotalMinutes = scheduledHour * 60 + scheduledMinute;
        const currentTotalMinutes = currentLocalHour * 60 + currentLocalMinute;

        const isTime =
          currentTotalMinutes >= scheduledTotalMinutes &&
          currentTotalMinutes < scheduledTotalMinutes + 15;

        if (!isTime) return false;

        // Ensure we haven't run it today yet in THIS timezone
        const lastRun = s.lastRun || 0;
        if (lastRun === 0) return true;

        const lastRunDate = new Date(lastRun);
        const lastRunParts = formatter.formatToParts(lastRunDate);
        const lastRunPartsMap: Record<string, string> = {};
        lastRunParts.forEach((p) => (lastRunPartsMap[p.type] = p.value));

        const isAlreadyRunToday =
          lastRunPartsMap.year === partsMap.year &&
          lastRunPartsMap.month === partsMap.month &&
          lastRunPartsMap.day === partsMap.day;

        return !isAlreadyRunToday;
      } catch (err) {
        console.error(
          `Error processing schedule ${s._id} for timezone ${ianaTz}:`,
          err,
        );
        return false;
      }
    });
  },
});

export const updateLastRun = mutation({
  args: { id: v.id("aiSchedule") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastRun: Date.now() });
  },
});

export const processScheduleCheck = action({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(api.ai.getSettings);
    if (!settings || !settings.isActive || !settings.apiKey) return;

    const pending = await ctx.runQuery(api.ai.getPendingSchedules);
    if (pending.length === 0) return;

    await ctx.runMutation(api.ai.setWritingStatus, { isWriting: true });
    try {
      for (const schedule of pending) {
        for (const topic of schedule.topicsToResearch) {
          try {
            await ctx.runAction(api.ai_actions.generateArticleFromTopic, {
              provider: settings.provider,
              apiKey: settings.apiKey,
              model: settings.model,
              topic,
              systemPrompt: settings.promptTemplate,
            });
          } catch (err) {
            console.error(
              `Failed to generate article for topic: ${topic}`,
              err,
            );
          }
        }
        await ctx.runMutation(api.ai.updateLastRun, { id: schedule._id });
      }
    } finally {
      await ctx.runMutation(api.ai.setWritingStatus, { isWriting: false });
    }
  },
});

export const runSingleResearch = action({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.ai.getSettings);
    if (!settings || !settings.apiKey)
      throw new Error("AI Settings not configured");

    await ctx.runMutation(api.ai.setWritingStatus, { isWriting: true });
    try {
      await ctx.runAction(api.ai_actions.generateArticleFromTopic, {
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        topic: args.topic,
        systemPrompt: settings.promptTemplate,
      });
    } finally {
      await ctx.runMutation(api.ai.setWritingStatus, { isWriting: false });
    }
  },
});

export const deleteSchedule = mutation({
  args: { id: v.id("aiSchedule") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listAIDrafts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .filter((q) => q.eq(q.field("source"), "ai"))
      .order("desc")
      .collect();
  },
});
