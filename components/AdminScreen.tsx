// @ts-nocheck
"use client";

import { Component, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

class ErrorBoundary extends Component<{ children: any }, { error: string | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error: String(error?.message ?? error) };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="helper" style={{ color: "#fca5a5", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          ⚠ Query error: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoNDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function AttendanceResults({
  studentId,
  fromDate,
  toDate,
}: {
  studentId: Id<"students">;
  fromDate: string;
  toDate: string;
}) {
  const attendance = useQuery(api.admin.getStudentAttendance as never, {
    studentId,
    fromDate,
    toDate,
  } as never) as any;

  if (attendance === undefined) {
    return <div className="helper">Loading…</div>;
  }

  if (!attendance?.rows?.length) {
    return <div className="helper">No attendance records found for this range.</div>;
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      {attendance.rows.map((row: any, idx: number) => (
        <div key={`${row.date}-${row.className}-${idx}`} className="studentRow">
          <div className="studentMeta">
            <div className="studentName">{row.date} · {row.className}</div>
            <div className="studentStatus">Taken by {row.takenByCoachName}</div>
          </div>
          <div className="studentActions">
            <span className="badge" style={{
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
  );
}

// ── Coach management ──────────────────────────────────────────────────────────

function CoachRow({ coach }: { coach: any }) {
  const updateCoach = useMutation(api.admin.updateCoach as never);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(coach.name);
  const [pin, setPin] = useState(coach.pin);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMsg(null);
    setSaving(true);
    try {
      await updateCoach({ coachId: coach._id, name, pin } as never);
      setMsg("Saved");
      setEditing(false);
    } catch (e: any) {
      setMsg(e?.message ?? "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setMsg(null);
    try {
      await updateCoach({ coachId: coach._id, active: !coach.active } as never);
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    }
  };

  return (
    <div className="studentRow" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="studentMeta">
          <div className="studentName">{coach.name}</div>
          <div className="studentStatus">PIN: {coach.pin} · {coach.active ? "Active" : "Inactive"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn" style={{ fontSize: 13, padding: "4px 10px" }} onClick={() => { setEditing(!editing); setMsg(null); setName(coach.name); setPin(coach.pin); }}>
            {editing ? "Cancel" : "Edit"}
          </button>
          <button className="btn" style={{ fontSize: 13, padding: "4px 10px", opacity: 0.7 }} onClick={toggleActive}>
            {coach.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="grid grid-2" style={{ gap: 8 }}>
            <div className="stack" style={{ gap: 4 }}>
              <div className="helper">Name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <div className="helper">PIN</div>
              <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={8} inputMode="numeric" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ alignSelf: "flex-start" }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}

      {msg && (
        <div className="helper" style={{ color: msg === "Saved" ? "#86efac" : "#fca5a5" }}>{msg}</div>
      )}
    </div>
  );
}

function CoachManager() {
  const coaches = useQuery(api.admin.listCoaches as never, {} as never) as any[] | undefined;
  const addCoach = useMutation(api.admin.addCoach as never);

  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || !newPin.trim()) {
      setAddMsg("Name and PIN are required");
      return;
    }
    setAddMsg(null);
    setAdding(true);
    try {
      await addCoach({ name: newName.trim(), pin: newPin.trim() } as never);
      setAddMsg(`Coach "${newName.trim()}" added`);
      setNewName("");
      setNewPin("");
    } catch (e: any) {
      setAddMsg(e?.message ?? "Error adding coach");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* Add new coach */}
      <div className="stack" style={{ gap: 8 }}>
        <div className="helper">Add new coach</div>
        <div className="grid grid-2" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="input"
            placeholder="PIN (numbers)"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            maxLength={8}
            inputMode="numeric"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={adding}
          style={{ alignSelf: "flex-start" }}
        >
          {adding ? "Adding…" : "Add coach"}
        </button>
        {addMsg && (
          <div className="helper" style={{ color: addMsg.startsWith("Coach "") ? "#86efac" : "#fca5a5" }}>
            {addMsg}
          </div>
        )}
      </div>

      {/* Existing coaches */}
      <div className="stack" style={{ gap: 8 }}>
        <div className="helper">Existing coaches</div>
        {coaches === undefined && <div className="helper">Loading…</div>}
        {coaches?.length === 0 && <div className="helper">No coaches yet.</div>}
        {coaches?.map((c: any) => <CoachRow key={c._id} coach={c} />)}
      </div>
    </div>
  );
}

// ── Main AdminScreen ──────────────────────────────────────────────────────────

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const students = useQuery(api.students.listStudents as never, {} as never) as any[] | undefined;

  const [studentId, setStudentId] = useState<string>("");
  const [fromDate, setFromDate] = useState(isoNDaysAgo(14));
  const [toDate, setToDate] = useState(isoToday());

  const selectedStudentName = useMemo(() => {
    if (!students || !studentId) return null;
    const found = students.find((s: any) => s._id === studentId);
    return found?.name ?? null;
  }, [students, studentId]);

  return (
    <main className="page stack">
      <div className="row-between">
        <button className="btn" onClick={onBack}>Back</button>
        <div className="badge">Admin</div>
      </div>

      {/* Attendance history */}
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
              {(students ?? []).map((s: any) => (
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
              {selectedStudentName ?? "Select a student to view attendance"}
            </div>
          </div>
          <button className="btn" onClick={() => { setFromDate(isoNDaysAgo(14)); setToDate(isoToday()); }}>
            Last 14 days
          </button>
        </div>

        {!studentId ? (
          <div className="helper">No student selected yet.</div>
        ) : (
          <ErrorBoundary key={studentId}>
            <AttendanceResults
              studentId={studentId as Id<"students">}
              fromDate={fromDate}
              toDate={toDate}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Coach management */}
      <div className="card stack">
        <div className="sectionTitle">Coach Management</div>
        <div className="subtitle">Add coaches or update their names and PINs.</div>
        <ErrorBoundary key="coaches">
          <CoachManager />
        </ErrorBoundary>
      </div>
    </main>
  );
}
