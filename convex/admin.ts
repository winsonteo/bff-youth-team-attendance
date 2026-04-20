import { mutation } from "./_generated/server";

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
