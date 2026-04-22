import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listClasses = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const classes = (await ctx.db.query("classes").collect())
      .filter((item) => item.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const results = [];
    for (const cls of classes) {
      const session = await ctx.db
        .query("attendanceSessions")
        .withIndex("by_class_date", (q) => q.eq("classId", cls._id).eq("date", today))
        .unique();

      let takenByCoachName: string | null = null;
      if (session) {
        const coach = await ctx.db.get(session.takenByCoachId);
        takenByCoachName = coach?.name ?? null;
      }

      results.push({
        ...cls,
        todaySession: session
          ? {
              _id: session._id,
              takenAt: session.takenAt,
              takenByCoachName,
            }
          : null,
      });
    }

    return results;
  },
});

export const getClassAttendance = query({
  args: {
    classId: v.id("classes"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date ?? new Date().toISOString().slice(0, 10);

    const cls = await ctx.db.get(args.classId);
    if (!cls) throw new Error("Class not found");

    const links = await ctx.db
      .query("studentClasses")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const students = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        return student;
      }),
    );

    const session = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId).eq("date", date))
      .unique();

    const records = session
      ? await ctx.db
          .query("attendanceRecords")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()
      : [];

    const recordMap = new Map(records.map((record) => [record.studentId, record.status]));

    const sessionGuests = session
      ? await ctx.db
          .query("sessionGuests")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()
      : [];

    return {
      class: cls,
      date,
      session: session
        ? {
            _id: session._id,
            takenAt: session.takenAt,
            takenByCoachId: session.takenByCoachId,
          }
        : null,
      students: students
        .filter((student): student is NonNullable<typeof student> => Boolean(student && student.active))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((student) => ({
          _id: student._id,
          name: student.name,
          status: recordMap.get(student._id) ?? null,
        })),
      guests: sessionGuests
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((guest) => ({
          _id: guest._id,
          name: guest.name,
          status: guest.status,
        })),
    };
  },
});

export const saveAttendance = mutation({
  args: {
    classId: v.id("classes"),
    coachId: v.id("coaches"),
    date: v.string(),
    records: v.array(
      v.object({
        studentId: v.id("students"),
        status: v.union(v.literal("present"), v.literal("absent")),
      }),
    ),
    guestRecords: v.optional(
      v.array(
        v.object({
          _id: v.optional(v.id("sessionGuests")),
          name: v.string(),
          status: v.union(v.literal("present"), v.literal("absent")),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let session = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_class_date", (q) => q.eq("classId", args.classId).eq("date", args.date))
      .unique();

    if (!session) {
      const sessionId = await ctx.db.insert("attendanceSessions", {
        classId: args.classId,
        date: args.date,
        takenByCoachId: args.coachId,
        takenAt: Date.now(),
      });
      session = await ctx.db.get(sessionId);
    } else {
      await ctx.db.patch(session._id, {
        takenByCoachId: args.coachId,
        takenAt: Date.now(),
      });
      session = await ctx.db.get(session._id);
    }

    if (!session) throw new Error("Unable to create attendance session");

    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const existingMap = new Map(existing.map((record) => [record.studentId, record]));
    const incomingIds = new Set(args.records.map((record) => record.studentId));

    for (const record of existing) {
      if (!incomingIds.has(record.studentId)) {
        await ctx.db.delete(record._id);
      }
    }

    for (const record of args.records) {
      const existingRecord = existingMap.get(record.studentId);
      if (existingRecord) {
        await ctx.db.patch(existingRecord._id, { status: record.status });
      } else {
        await ctx.db.insert("attendanceRecords", {
          sessionId: session._id,
          studentId: record.studentId,
          status: record.status,
        });
      }
    }

    // Handle session guests
    const guestRecords = args.guestRecords ?? [];
    const existingGuests = await ctx.db
      .query("sessionGuests")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const incomingGuestIds = new Set(guestRecords.map((g) => g._id).filter(Boolean));

    for (const guest of existingGuests) {
      if (!incomingGuestIds.has(guest._id)) {
        await ctx.db.delete(guest._id);
      }
    }

    const existingGuestMap = new Map(existingGuests.map((g) => [g._id, g]));

    for (const guest of guestRecords) {
      if (guest._id && existingGuestMap.has(guest._id)) {
        await ctx.db.patch(guest._id, { status: guest.status, name: guest.name });
      } else {
        await ctx.db.insert("sessionGuests", {
          sessionId: session._id,
          name: guest.name,
          status: guest.status,
        });
      }
    }

    return { ok: true, sessionId: session._id };
  },
});
