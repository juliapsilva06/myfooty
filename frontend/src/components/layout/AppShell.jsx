import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, USE_MOCK } from "../../api/client.js";
import { useChat } from "../../hooks/useChat.js";
import Dashboard from "../dashboard/Dashboard.jsx";
import ChatPanel from "../chat/ChatPanel.jsx";

export default function AppShell({ dashboard }) {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Lives here (not inside ChatPanel) so the conversation survives closing the panel.
  const assistant = useChat("assistant");
  const teamNames = dashboard.preferences.teams.map((t) => t.name).join(", ");

  async function handleEdit() {
    if (!window.confirm("This will restart setup. Continue?")) return;
    setResetting(true);
    try {
      await api.resetPreferences();
      assistant.reset();
      queryClient.removeQueries({ queryKey: ["widget"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-header__title">My Dashboard</h1>
          {teamNames && <p className="muted small">{teamNames}</p>}
        </div>
        <div className="app-header__actions">
          {USE_MOCK && <span className="badge">Sample data</span>}
          <button className="btn btn-primary" onClick={() => setChatOpen(true)}>
            Ask
          </button>
          <button className="btn btn-quiet" onClick={handleEdit} disabled={resetting}>
            Edit my dashboard
          </button>
        </div>
      </header>
      <main className="app-main">
        <Dashboard widgets={dashboard.widgets} />
      </main>
      {chatOpen && <ChatPanel chat={assistant} onClose={() => setChatOpen(false)} />}
    </>
  );
}
