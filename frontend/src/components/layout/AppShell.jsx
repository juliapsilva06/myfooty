import { useEffect, useMemo, useState } from "react";
import { USE_MOCK } from "../../api/client.js";
import { SITE_NAME } from "../../config/appearance.js";
import { ASSISTANT_ENABLED } from "../../config/features.js";
import { useChat } from "../../hooks/useChat.js";
import { useTheme } from "../../hooks/useTheme.js";
import { AssistantProvider } from "../../context/AssistantContext.jsx";
import { PreferencesProvider } from "../../context/PreferencesContext.jsx";
import { formatToday } from "../../lib/formatDate.js";
import Dashboard from "../dashboard/Dashboard.jsx";
import ChatPanel from "../chat/ChatPanel.jsx";
import SetupScreen from "../setup/SetupScreen.jsx";
import Brand from "./Brand.jsx";
import HeaderMenu from "./HeaderMenu.jsx";

export default function AppShell({ dashboard }) {
  const [editing, setEditing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  // Lives here (not inside ChatPanel) so the conversation survives closing the panel.
  const assistant = useChat("assistant");

  useEffect(() => {
    document.title = SITE_NAME;
  }, []);

  // Cards call ask("...") to open the panel and send a ready-made question.
  const { send } = assistant;
  const assistantApi = useMemo(
    () => ({
      enabled: ASSISTANT_ENABLED,
      ask: (question) => {
        if (!ASSISTANT_ENABLED) return;
        setChatOpen(true);
        send(question);
      },
    }),
    [send]
  );

  // "Edit dashboard" reopens the search form with your current choices filled in.
  if (editing) {
    return (
      <SetupScreen
        initial={dashboard.preferences}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <PreferencesProvider preferences={dashboard.preferences}>
      <AssistantProvider value={assistantApi}>
        <header className="app-header">
          <div className="brand">
            <Brand />
            <p className="brand__subtitle">{formatToday()}</p>
          </div>
          <div className="app-header__actions">
            {USE_MOCK && <span className="badge">Sample data</span>}
            {ASSISTANT_ENABLED && (
              <button className="btn btn-primary" onClick={() => setChatOpen(true)}>
                Ask a question
              </button>
            )}
            <HeaderMenu theme={theme} onThemeChange={setTheme} onEdit={() => setEditing(true)} />
          </div>
        </header>
        <main className="app-main">
          <Dashboard widgets={dashboard.widgets} />
        </main>
        {ASSISTANT_ENABLED && chatOpen && <ChatPanel chat={assistant} onClose={() => setChatOpen(false)} />}
      </AssistantProvider>
    </PreferencesProvider>
  );
}
