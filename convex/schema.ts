import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  coaches: defineTable({
    name: v.string(),
    pin: v.string(),
    active: v.boolean(),
  }).index("by_pin", ["pin"]),

  classes: defineTable({
    name: v.string(),
    sortOrder: v.number(),
    active: v.boolean(),
  }),

  students: defineTable({
    name: v.string(),
    active: v.boolean(),
  }),

  studentClasses: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"]),

  attendanceSessions: defineTable({
    classId: v.id("classes"),
    date: v.string(),
    takenByCoachId: v.id("coaches"),
    takenAt: v.number(),
  })
    .index("by_class_date", ["classId", "date"])
    .index("by_date", ["date"]),

  attendanceRecords: defineTable({
    sessionId: v.id("attendanceSessions"),
    studentId: v.id("students"),
    status: v.union(v.literal("present"), v.literal("absent")),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_student", ["sessionId", "studentId"]),
});
