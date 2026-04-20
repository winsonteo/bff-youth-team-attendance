"use client";

import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { ClassDashboard } from "@/components/ClassDashboard";
import { AttendanceScreen } from "@/components/AttendanceScreen";
import type { Id } from "@/convex/_generated/dataModel";

type Coach = {
  _id: Id<"coaches">;
  name: string;
};

export default function HomePage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(null);

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

  if (selectedClassId) {
    return (
      <AttendanceScreen
        coach={coach}
        classId={selectedClassId}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  return <ClassDashboard coach={coach} onSelectClass={setSelectedClassId} onLogout={() => setCoach(null)} />;
}
