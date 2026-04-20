// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (coach: { _id: Id<"coaches">; name: string }) => void }) {
  const login = useMutation(api.auth.loginWithPin as never);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await login({ pin });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLoggedIn(result.coach);
      setPin("");
    } catch {
      setError("Could not log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="card stack">
        <div className="title">BFF Youth Attendance</div>
        <div className="subtitle">Coach PIN login</div>
        <input
          className="pinInput"
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pin.length === 4 && !loading) {
              void submit();
            }
          }}
        />
        {error ? <div className="helper" style={{ color: "#b42318" }}>{error}</div> : null}
        <button className="btn btn-primary" disabled={pin.length !== 4 || loading} onClick={() => void submit()}>
          {loading ? "Logging in..." : "Enter"}
        </button>
      </div>
    </main>
  );
}
