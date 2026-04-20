import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const resetAllData = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of [
      "attendanceRecords",
      "attendanceSessions",
      "studentClasses",
      "students",
      "classes",
      "coaches",
    ] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }
    return { ok: true };
  },
});

export const ensureCoach = mutation({
  args: {
    name: v.string(),
    pin: v.string(),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const active = args.active ?? true;
    const existing = await ctx.db
      .query("coaches")
      .withIndex("by_pin", (q) => q.eq("pin", args.pin))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        active,
      });
      return { ok: true, coachId: existing._id, action: "updated" as const };
    }

    const coachId = await ctx.db.insert("coaches", {
      name: args.name,
      pin: args.pin,
      active,
    });

    return { ok: true, coachId, action: "created" as const };
  },
});

export const getStudentAttendance = query({
  args: {
    studentId: v.id("students"),
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Dates are ISO yyyy-mm-dd, so lexical ordering works.
    const sessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_date", (q) => q.gte("date", args.fromDate).lte("date", args.toDate))
      .collect();

    const classCache = new Map<string, { _id: string; name: string }>();
    const coachCache = new Map<string, { _id: string; name: string }>();

    const rows: {
      date: string;
      className: string;
      status: "present" | "absent";
      takenByCoachName: string;
      takenAt: number;
    }[] = [];

    for (const session of sessions) {
      const record = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_session_student", (q) => q.eq("sessionId", session._id).eq("studentId", args.studentId))
        .unique();

      if (!record) continue;

      let cls = classCache.get(session.classId);
      if (!cls) {
        const fetched = await ctx.db.get(session.classId);
        cls = { _id: session.classId, name: fetched?.name ?? "Unknown class" };
        classCache.set(session.classId, cls);
      }

      let coach = coachCache.get(session.takenByCoachId);
      if (!coach) {
        const fetched = await ctx.db.get(session.takenByCoachId);
        coach = { _id: session.takenByCoachId, name: fetched?.name ?? "Unknown coach" };
        coachCache.set(session.takenByCoachId, coach);
      }

      rows.push({
        date: session.date,
        className: cls.name,
        status: record.status,
        takenByCoachName: coach.name,
        takenAt: session.takenAt,
      });
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.className.localeCompare(b.className)));

    return { ok: true, rows };
  },
});
