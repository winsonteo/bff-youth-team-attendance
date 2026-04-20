// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function ClassDashboard({
  coach,
  onSelectClass,
  onLogout,
}: {
  coach: { _id: Id<"coaches">; name: string };
  onSelectClass: (classId: Id<"classes">) => void;
  onLogout: () => void;
}) {
  const classes = useQuery(api.classes.listClasses as never, {} as never);

  return (
    <main className="page stack">
      <div className="row-between">
        <div>
          <div className="title">Hi {coach.name}</div>
          <div className="subtitle">Choose a class to take attendance</div>
        </div>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="grid grid-2">
        {(classes ?? []).map((cls) => (
          <button key={cls._id} className="classCard stack" onClick={() => onSelectClass(cls._id)}>
            <div className="row-between">
              <div className="studentName">{cls.name}</div>
              <span className="badge">{cls.todaySession ? "Taken" : "Not taken"}</span>
            </div>
            <div className="helper">
              {cls.todaySession
                ? `Taken by ${cls.todaySession.takenByCoachName ?? "coach"}`
                : "Attendance not taken yet today"}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
