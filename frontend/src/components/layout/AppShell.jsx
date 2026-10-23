import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, USE_MOCK } from "../../api/client.js";
import { useChat } from "../../hooks/useChat.js";
import { useTheme } from "../../hooks/useTheme.js";
import { PreferencesProvider } from "../../context/PreferencesContext.jsx";
import { formatToday } from "../../lib/formatDate.js";
import Dashboard from "../dashboard/Dashboard.jsx";
import ChatPanel from "../chat/ChatPanel.jsx";
import HeaderMenu from "./HeaderMenu.jsx";

export default function AppShell({ dashboard }) {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, setTheme } = useTheme();
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
    <PreferencesProvider preferences={dashboard.preferences}>
      <header className="app-header">
        <div>
          <h1 className="app-header__title display">{formatToday()}</h1>
          {teamNames && <p className="muted small">{teamNames}</p>}
        </div>
        <div className="app-header__actions">
          {USE_MOCK && <span className="badge">Sample data</span>}
          <button className="btn btn-primary" onClick={() => setChatOpen(true)}>
            Ask a question
          </button>
          <HeaderMenu theme={theme} onThemeChange={setTheme} onEdit={handleEdit} busy={resetting} />
        </div>
      </header>
      <main className="app-main">
        <Dashboard widgets={dashboard.widgets} />
      </main>
      {chatOpen && <ChatPanel chat={assistant} onClose={() => setChatOpen(false)} />}
    </PreferencesProvider>
  );
}
