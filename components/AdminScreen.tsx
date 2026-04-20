// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoNDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function AdminScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const students = useQuery(api.students.listStudents as never, {} as never) as any[] | undefined;

  const [studentId, setStudentId] = useState<string>("");
  const [fromDate, setFromDate] = useState(isoNDaysAgo(14));
  const [toDate, setToDate] = useState(isoToday());

  const attendance = useQuery(
    api.admin.getStudentAttendance as never,
    studentId
      ? ({
          studentId: studentId as Id<"students">,
          fromDate,
          toDate,
        } as never)
      : undefined,
  ) as any;

  const ensureCoach = useMutation(api.admin.ensureCoach as never);
  const [coachMsg, setCoachMsg] = useState<string | null>(null);

  const selectedStudentName = useMemo(() => {
    if (!students || !studentId) return null;
    const found = students.find((s) => s._id === studentId);
    return found?.name ?? null;
  }, [students, studentId]);

  const addShiQi = async () => {
    setCoachMsg(null);
    try {
      const result = await ensureCoach({ name: "Shi Qi", pin: "1986", active: true });
      setCoachMsg(result.action === "created" ? "Coach Shi Qi added" : "Coach Shi Qi updated");
    } catch (error) {
      setCoachMsg(error instanceof Error ? error.message : "Could not add coach");
    }
  };

  return (
    <main className="page stack">
      <div className="row-between">
        <button className="btn" onClick={onBack}>Back</button>
        <div className="badge">Admin</div>
      </div>

      <div className="card stack heroCard">
        <div className="title">Attendance History</div>
        <div className="subtitle">Pick a student, filter by date range, and export by screenshot if needed.</div>

        <div className="grid grid-2">
          <div className="stack" style={{ gap: 8 }}>
            <div className="helper">Student</div>
            <select
              className="input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select a student…</option>
              {(students ?? []).map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="helper">Date range</div>
            <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
              <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card stack">
        <div className="row-between">
          <div>
            <div className="sectionTitle">Results</div>
            <div className="helper">
              {selectedStudentName ? selectedStudentName : "Select a student to view attendance"}
            </div>
          </div>
          <button
            className="btn"
            onClick={() => {
              setFromDate(isoNDaysAgo(14));
              setToDate(isoToday());
            }}
          >
            Last 14 days
          </button>
        </div>

        {!studentId ? (
          <div className="helper">No student selected yet.</div>
        ) : attendance === undefined ? (
          <div className="helper">Loading…</div>
        ) : attendance?.rows?.length ? (
          <div className="stack" style={{ gap: 10 }}>
            {attendance.rows.map((row: any, idx: number) => (
              <div key={`${row.date}-${row.className}-${idx}`} className="studentRow">
                <div className="studentMeta">
                  <div className="studentName">{row.date} · {row.className}</div>
                  <div className="studentStatus">Taken by {row.takenByCoachName}</div>
                </div>
                <div className="studentActions">
                  <span className={`badge`} style={{
                    background: row.status === "present" ? "rgba(34, 197, 94, 0.14)" : "rgba(239, 68, 68, 0.14)",
                    borderColor: row.status === "present" ? "rgba(34, 197, 94, 0.24)" : "rgba(239, 68, 68, 0.24)",
                    color: row.status === "present" ? "#bbf7d0" : "#fecaca",
                  }}>
                    {row.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="helper">No attendance records found for this range.</div>
        )}
      </div>

      <div className="card stack">
        <div className="sectionTitle">Admin Tools</div>
        <div className="subtitle">This updates the live Convex data.</div>
        <button className="btn btn-primary" onClick={() => void addShiQi()}>
          Add coach: Shi Qi (PIN 1986)
        </button>
        {coachMsg ? <div className="helper">{coachMsg}</div> : null}
      </div>
    </main>
  );
}
