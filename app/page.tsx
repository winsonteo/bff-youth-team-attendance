"use client";

import { useMemo, useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { ClassDashboard } from "@/components/ClassDashboard";
import { AttendanceScreen } from "@/components/AttendanceScreen";
import { AdminScreen } from "@/components/AdminScreen";
import type { Id } from "@/convex/_generated/dataModel";

type Coach = {
  _id: Id<"coaches">;
  name: string;
};

export default function HomePage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  const isAdmin = useMemo(() => {
    if (!coach) return false;
    return coach.name.toLowerCase() === "winson";
  }, [coach]);

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className="page">
        <div className="card stack">
          <div className="title">BFF Youth Attendance</div>
          <div className="subtitle">
            Add <code>NEXT_PUBLIC_CONVEX_URL</code> to <code>.env.local</code>, then run Convex.
          </div>
        </div>
      </main>
    );
  }

  if (!coach) {
    return <LoginScreen onLoggedIn={setCoach} />;
  }

  if (adminMode && isAdmin) {
    return <AdminScreen onBack={() => setAdminMode(false)} />;
  }

  if (selectedClassId) {
    return (
      <AttendanceScreen
        coach={coach}
        classId={selectedClassId}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  return (
    <ClassDashboard
      coach={coach}
      onSelectClass={setSelectedClassId}
      onLogout={() => {
        setCoach(null);
        setSelectedClassId(null);
        setAdminMode(false);
      }}
      onAdmin={isAdmin ? () => setAdminMode(true) : undefined}
    />
  );
}
