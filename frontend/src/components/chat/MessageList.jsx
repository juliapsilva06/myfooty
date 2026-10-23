import { useEffect, useRef, useState } from "react";
import "../../styles/chat.css";

function Typing() {
  const [slow, setSlow] = useState(false);
  // Fetching sports data can be slow on the free API tier, so reassure the user.
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bubble bubble-assistant" aria-label="The assistant is typing">
      <span className="dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {slow && <p className="muted small">Still working. Fetching data can take a moment.</p>}
    </div>
  );
}

export default function MessageList({ messages, busy, error, onRetry, emptyHint }) {
  const endRef = useRef(null);
  const visible = messages.filter((m) => !m.hidden);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, error]);

  return (
    <div className="message-list" role="log" aria-live="polite">
      {!visible.length && !busy && !error && emptyHint}
      {visible.map((m, i) => (
        <div key={i} className={`bubble bubble-${m.role}`}>
          {m.content}
        </div>
      ))}
      {busy && <Typing />}
      {error && (
        <div className="bubble bubble-error" role="alert">
          <p>{error}</p>
          <button className="btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
