import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";

// PLACEHOLDER (Phase 1). The real onboarding chat arrives in Phase 3.
// For now one button calls the same /api/chat endpoint the real screen will use,
// so you can already see the onboarded -> dashboard transition work.
export default function OnboardingScreen() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.chat("onboarding", [
        { role: "user", content: "Hi, help me set up my dashboard" },
      ]);
      if (res.dashboard_updated) {
        queryClient.removeQueries({ queryKey: ["widget"] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="center-screen__box">
        <h1>Let's set up your dashboard</h1>
        <p className="muted">
          Soon, a short chat will ask which teams, leagues, and stats you care about.
          That chat is coming in Phase 3. For now, load a sample dashboard.
        </p>
        <button className="btn btn-primary" onClick={handleStart} disabled={busy}>
          {busy ? "Setting up..." : "Load sample dashboard"}
        </button>
        {error && <p role="alert" className="muted">{error}</p>}
      </div>
    </div>
  );
}
