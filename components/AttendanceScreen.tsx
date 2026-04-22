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
  const allStudents = useQuery(api.students.listStudents as never);
  const saveAttendance = useMutation(api.classes.saveAttendance as never);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [guests, setGuests] = useState<Array<{ id: string; name: string; isNew: boolean }>>([]);
  const [nextGuestId, setNextGuestId] = useState(1);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!attendance) return;
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = student.status;
    }
    const loadedGuests: Array<{ id: string; name: string; isNew: boolean }> = [];
    for (const guest of attendance.guests) {
      next[guest._id] = guest.status;
      loadedGuests.push({ id: guest._id, name: guest.name, isNew: false });
    }
    setStatuses(next);
    setGuests(loadedGuests);
  }, [attendance]);

  const counts = useMemo(() => {
    if (!attendance) return { present: 0, absent: 0, total: 0 };
    const values = [
      ...attendance.students.map((s) => statuses[s._id]),
      ...guests.map((g) => statuses[g.id]),
    ];
    return {
      present: values.filter((value) => value === "present").length,
      absent: values.filter((value) => value === "absent").length,
      total: values.length,
    };
  }, [statuses, attendance, guests]);

  const availableGuests = useMemo(() => {
    if (!allStudents || !attendance) return [];
    const classStudentIds = new Set(attendance.students.map((s) => s._id));
    const guestIds = new Set(guests.map((g) => g.id));
    return allStudents
      .filter((s) => !classStudentIds.has(s._id) && !guestIds.has(s._id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, attendance, guests]);

  if (!attendance) {
    return (
      <main className="page">
        <div className="card">Loading...</div>
      </main>
    );
  }

  const setStatus = (id: string, status: Status) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  };

  const markAllPresent = () => {
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = "present";
    }
    for (const guest of guests) {
      next[guest.id] = "present";
    }
    setStatuses(next);
  };

  const resetAll = () => {
    const next: Record<string, Status> = {};
    for (const student of attendance.students) {
      next[student._id] = null;
    }
    for (const guest of guests) {
      next[guest.id] = null;
    }
    setStatuses(next);
  };

  const addGuest = () => {
    if (!selectedGuestId || !allStudents) return;
    const student = allStudents.find((s) => s._id === selectedGuestId);
    if (!student) return;
    const id = `guest-new-${nextGuestId}`;
    setNextGuestId((prev) => prev + 1);
    setGuests((prev) => [...prev, { id, name: student.name, isNew: true }]);
    setStatuses((current) => ({ ...current, [id]: "present" }));
    setSelectedGuestId("");
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setStatuses((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const submit = async () => {
    const records = attendance.students
      .map((student) => ({ studentId: student._id, status: statuses[student._id] }))
      .filter((record): record is { studentId: Id<"students">; status: "present" | "absent" } => Boolean(record.status));

    const guestRecords = guests
      .map((guest) => {
        const base = {
          name: guest.name,
          status: statuses[guest.id],
        };
        return guest.isNew ? base : { ...base, _id: guest.id };
      })
      .filter((record) => Boolean(record.status));

    setSaving(true);
    setMessage(null);
    try {
      await saveAttendance({
        classId,
        coachId: coach._id,
        date: attendance.date,
        records,
        guestRecords,
      });
      setMessage("Attendance saved");
    } catch {
      setMessage("Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const allEntries = [
    ...guests
      .map((g) => ({ id: g.id, name: g.name, isGuest: true }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    ...attendance.students
      .map((s) => ({ id: s._id, name: s.name, isGuest: false }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return (
    <main className="page stack">
      <div className="row-between">
        <button className="btn" onClick={onBack}>Back</button>
        <div className="badge">{attendance.date}</div>
      </div>

      <div className="card stack heroCard">
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

      {availableGuests.length > 0 ? (
        <div className="card stack">
          <div className="sectionTitle">Add Guest</div>
          <div className="row">
            <select
              className="input"
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select a student…</option>
              {availableGuests.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
            <button className="btn" onClick={addGuest} disabled={!selectedGuestId}>
              Add
            </button>
          </div>
        </div>
      ) : null}

      <div className="card stack">
        <div className="sectionTitle">Roster</div>
        {allEntries.map((entry) => {
          const status = statuses[entry.id];
          return (
            <div key={entry.id} className="studentRow">
              <div className="studentMeta">
                <div className="studentName">
                  {entry.name}
                  {entry.isGuest ? (
                    <span className="badge" style={{ marginLeft: 10, padding: "8px 14px", fontSize: 13, background: "rgba(168, 85, 247, 0.22)", color: "#f3e8ff", borderColor: "rgba(168, 85, 247, 0.45)" }}>
                      Guest
                    </span>
                  ) : null}
                </div>
                <div className="studentStatus">
                  {entry.isGuest
                    ? "Guest — marked present"
                    : status === "present"
                      ? "Marked present"
                      : status === "absent"
                        ? "Marked absent"
                        : "Not marked yet"}
                </div>
              </div>
              <div className="studentActions">
                {!entry.isGuest ? (
                  <>
                    <button
                      className={`btn studentAction ${status === "present" ? "btn-selected-green" : "btn-green"}`}
                      onClick={() => setStatus(entry.id, "present")}
                    >
                      Present
                    </button>
                    <button
                      className={`btn studentAction ${status === "absent" ? "btn-selected-red" : "btn-red"}`}
                      onClick={() => setStatus(entry.id, "absent")}
                    >
                      Absent
                    </button>
                  </>
                ) : (
                  <button className="btn studentAction" onClick={() => removeGuest(entry.id)} style={{ minWidth: "auto", padding: "12px 18px" }}>
                    Remove
                  </button>
                )}
              </div>
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
