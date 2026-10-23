import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "../../hooks/useChat.js";
import MessageList from "../chat/MessageList.jsx";
import MessageInput from "../chat/MessageInput.jsx";

export default function OnboardingScreen() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const chat = useChat("onboarding", { onDashboardUpdated: () => setReady(true) });

  // Kick off the conversation automatically with a hidden first message,
  // so the agent greets the user without them typing anything.
  // The ref stops React StrictMode (dev only) from sending it twice.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    chat.send("Hi, help me set up my dashboard", { hidden: true });
  }, [chat.send]);

  async function handleFinish() {
    // Preferences changed, so throw away old widget data and reload the layout.
    queryClient.removeQueries({ queryKey: ["widget"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="onboarding">
      <header className="onboarding__header">
        <h1>Let's set up your dashboard</h1>
        <p className="muted small">Teams, then leagues, then stats</p>
      </header>

      <MessageList
        messages={chat.messages}
        busy={chat.busy}
        error={chat.error}
        onRetry={chat.retry}
      />

      {ready ? (
        <div className="ready-banner">
          <p>Your dashboard is ready.</p>
          <button className="btn btn-primary" onClick={handleFinish}>
            Go to my dashboard
          </button>
        </div>
      ) : (
        <MessageInput
          onSend={chat.send}
          busy={chat.busy}
          placeholder="Type your answer..."
          autoFocus
        />
      )}
    </div>
  );
}
