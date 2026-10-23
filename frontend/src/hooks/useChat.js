import { useCallback, useRef, useState } from "react";
import { api } from "../api/client.js";

// Holds one conversation. The backend is stateless, so the full history is sent every time.
// messages: [{ role: "user" | "assistant", content: string, hidden?: boolean }]
// `hidden` messages are sent to the backend but not shown (used for the automatic first message).
export function useChat(mode, { onDashboardUpdated } = {}) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Refs always hold the latest values, so callbacks below never use stale state.
  const messagesRef = useRef(messages);
  const busyRef = useRef(false);
  const callbackRef = useRef(onDashboardUpdated);
  messagesRef.current = messages;
  callbackRef.current = onDashboardUpdated;

  const run = useCallback(
    async (history) => {
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        const payload = history.map(({ role, content }) => ({ role, content }));
        const res = await api.chat(mode, payload);
        setMessages([...history, { role: "assistant", content: res.answer || "(No reply)" }]);
        if (res.dashboard_updated) callbackRef.current?.();
      } catch (e) {
        setError(e.message || "Something went wrong.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [mode]
  );

  const send = useCallback(
    (text, { hidden = false } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;
      const history = [...messagesRef.current, { role: "user", content: trimmed, hidden }];
      setMessages(history);
      run(history);
    },
    [run]
  );

  // After an error the failed user message is still the last one in history.
  const retry = useCallback(() => {
    const history = messagesRef.current;
    if (busyRef.current || !history.length || history[history.length - 1].role !== "user") return;
    run(history);
  }, [run]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, busy, error, send, retry, reset };
}
