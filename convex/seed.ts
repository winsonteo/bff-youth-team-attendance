import { mutation } from "./_generated/server";

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const existingClasses = await ctx.db.query("classes").collect();
    if (existingClasses.length > 0) {
      return { ok: true, message: "Seed skipped, data already exists." };
    }

    const coachIds = await Promise.all([
      ctx.db.insert("coaches", { name: "Winson", pin: "2835", active: true }),
      ctx.db.insert("coaches", { name: "Deeyan", pin: "1111", active: true }),
      ctx.db.insert("coaches", { name: "Esther", pin: "2222", active: true }),
    ]);

    const classNames = [
      "Monday",
      "Tuesday",
      "Thursday",
      "Saturday (Main)",
      "Saturday (Tiny)",
      "Sunday",
    ];

    const classIdEntries = await Promise.all(
      classNames.map(async (name, index) => [
        name,
        await ctx.db.insert("classes", { name, sortOrder: index + 1, active: true }),
      ] as const),
    );
    const classIdMap = Object.fromEntries(classIdEntries);

    const roster: Record<string, string[]> = {
      "Jovan Teo": ["Monday", "Thursday", "Saturday (Main)", "Sunday"],
      "Asher Teo": ["Monday", "Tuesday", "Thursday", "Saturday (Tiny)"],
      "Larissa On": ["Monday", "Thursday", "Saturday (Main)"],
      "Luna Poh": ["Monday", "Saturday (Main)"],
      "Arielle Phua": ["Monday", "Thursday", "Saturday (Main)"],
      "Callum Li": ["Monday", "Saturday (Main)"],
      "Mia Holmes": ["Monday", "Tuesday", "Saturday (Tiny)"],
      "Tara Faith Lee": ["Monday", "Thursday", "Saturday (Main)"],
      "Neo Rui Yun": ["Monday", "Saturday (Main)"],
      "David Lim": ["Monday", "Saturday (Main)"],
      "Elizabeth Lim": ["Monday", "Saturday (Main)"],
      "Neo Krink": ["Monday", "Saturday (Main)", "Sunday"],
      "Keisuke Izumi": ["Monday", "Saturday (Main)"],
      "Ariel Lee": ["Monday", "Thursday", "Saturday (Main)"],
      "Aloysius Ong": ["Monday", "Saturday (Main)"],
      "Noel": ["Monday", "Saturday (Tiny)"],
      "Vivienne Ong": ["Tuesday", "Saturday (Tiny)"],
      "Connor Li": ["Tuesday", "Thursday", "Saturday (Tiny)"],
      "Xinrui": ["Tuesday", "Saturday (Tiny)"],
      "Leia": ["Tuesday", "Saturday (Tiny)"],
      "Ezra": ["Tuesday", "Saturday (Tiny)"],
      "Julian": ["Tuesday", "Saturday (Tiny)"],
      "Ming Xuan": ["Tuesday", "Saturday (Tiny)"],
      "Daniel Toh": ["Thursday", "Saturday (Main)"],
      "Kieran Ong": ["Thursday", "Saturday (Main)"],
      "David Warrior": ["Thursday", "Saturday (Main)"],
            "Hannah Hoo": ["Thursday", "Saturday (Main)"],
      "Charlotte Low": ["Thursday", "Saturday (Main)"],
      "Cadence": ["Thursday", "Saturday (Main)"],
      "Moses loh": ["Thursday", "Saturday (Main)"],
      "Erin Grace Lee": ["Thursday", "Saturday (Main)", "Sunday"],
      "Bailey Goh": ["Thursday", "Saturday (Main)", "Saturday (Tiny)"],
            "Kyla Teoh": ["Saturday (Main)", "Sunday"],
      "Leanne On": ["Saturday (Main)", "Sunday"],
      "Isaiah Lee": ["Saturday (Main)"],
      "Sosuke Inoue": ["Saturday (Main)", "Sunday"],
      "Isemay Tan Hee": ["Saturday (Main)", "Sunday"],
          };

    const studentIds: string[] = [];

    for (const [studentName, classes] of Object.entries(roster)) {
      const studentId = await ctx.db.insert("students", { name: studentName, active: true });
      studentIds.push(studentId);

      for (const className of classes) {
        const classId = classIdMap[className];
        if (!classId) {
          throw new Error(`Missing class mapping for ${className}`);
        }
        await ctx.db.insert("studentClasses", {
          studentId,
          classId,
        });
      }
    }

    return {
      ok: true,
      coachIds,
      classIds: classIdMap,
      studentIds,
    };
  },
});
