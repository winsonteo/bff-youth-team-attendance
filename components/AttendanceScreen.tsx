// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Status = "present" | "absent" | null;

export function AttendanceScreen({
  coach,
  classId,
  onBack,
}: {
  coach: { _id: Id<"coaches">; name: string };
  classId: Id<"classes">;
  onBack: () => void;
}) {
  const attendance = useQuery(api.classes.getClassAttendance as never, { classId } as never);
  const saveAttendance = useMutation(api.classes.saveAttendance as never);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!attendance) return;
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = student.status;
    }
    setStatuses(next);
  }, [attendance]);

  const counts = useMemo(() => {
    const values = Object.values(statuses);
    return {
      present: values.filter((value) => value === "present").length,
      absent: values.filter((value) => value === "absent").length,
      total: values.length,
    };
  }, [statuses]);

  if (!attendance) {
    return (
      <main className="page">
        <div className="card">Loading...</div>
      </main>
    );
  }

  const setStatus = (studentId: string, status: Status) => {
    setStatuses((current) => ({ ...current, [studentId]: status }));
  };

  const markAllPresent = () => {
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = "present";
    }
    setStatuses(next);
  };

  const resetAll = () => {
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = null;
    }
    setStatuses(next);
  };

  const submit = async () => {
    const records = attendance.students
      .map((student) => ({ studentId: student._id, status: statuses[student._id] }))
      .filter((record): record is { studentId: Id<"students">; status: "present" | "absent" } => Boolean(record.status));

    setSaving(true);
    setMessage(null);
    try {
      await saveAttendance({
        classId,
        coachId: coach._id,
        date: attendance.date,
        records,
      });
      setMessage("Attendance saved");
    } catch {
      setMessage("Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page stack">
      <div className="row-between">
        <button className="btn" onClick={onBack}>Back</button>
        <div className="badge">{attendance.date}</div>
      </div>

      <div className="card stack">
        <div className="title">{attendance.class.name}</div>
        <div className="subtitle">Taken by {coach.name}</div>
        <div className="row">
          <span className="badge">Present {counts.present}</span>
          <span className="badge">Absent {counts.absent}</span>
          <span className="badge">Roster {counts.total}</span>
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={markAllPresent}>Mark all present</button>
        <button className="btn" onClick={resetAll}>Reset</button>
      </div>

      <div className="card stack">
        <div className="sectionTitle">Roster</div>
        {attendance.students.map((student) => {
          const status = statuses[student._id];
          return (
            <div key={student._id} className="studentRow">
              <div className="studentName">{student.name}</div>
              <button
                className={`btn ${status === "present" ? "btn-selected-green" : "btn-green"}`}
                onClick={() => setStatus(student._id, "present")}
              >
                Present
              </button>
              <button
                className={`btn ${status === "absent" ? "btn-selected-red" : "btn-red"}`}
                onClick={() => setStatus(student._id, "absent")}
              >
                Absent
              </button>
            </div>
          );
        })}
      </div>

      {message ? <div className="helper">{message}</div> : null}

      <button className="btn btn-primary" onClick={() => void submit()} disabled={saving}>
        {saving ? "Saving..." : "Save attendance"}
      </button>
    </main>
  );
}
