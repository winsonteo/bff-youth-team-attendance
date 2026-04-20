import { query } from "./_generated/server";

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    return students
      .filter((student) => student.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
