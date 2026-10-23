import { useEffect } from "react";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";

const SUGGESTIONS = [
  "When is my next match?",
  "Who's top of the table?",
  "Who leads in assists?",
];

// Slide-over assistant. The conversation lives in the `chat` object owned by AppShell,
// so closing the panel doesn't lose the history.
export default function ChatPanel({ chat, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emptyHint = (
    <div className="chat-empty">
      <p className="muted">Ask about your teams, the table, scorers, or anything else in the data.</p>
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion" onClick={() => chat.send(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="chat-panel" aria-label="Ask about your teams">
      <div className="chat-panel__header">
        <h2>Ask about your teams</h2>
        <div className="app-header__actions">
          {chat.messages.length > 0 && (
            <button className="btn btn-quiet" onClick={chat.reset}>
              Clear
            </button>
          )}
          <button className="btn btn-quiet" onClick={onClose} aria-label="Close chat">
            Close
          </button>
        </div>
      </div>
      <MessageList
        messages={chat.messages}
        busy={chat.busy}
        error={chat.error}
        onRetry={chat.retry}
        emptyHint={emptyHint}
      />
      <MessageInput
        onSend={chat.send}
        busy={chat.busy}
        placeholder="Ask anything about the data..."
        autoFocus
      />
    </aside>
  );
}
