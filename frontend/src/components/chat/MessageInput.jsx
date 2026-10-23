import { useId, useState } from "react";
import "../../styles/chat.css";

// `busy`: a reply is loading (typing is allowed, sending is not).
// `disabled`: the whole input is switched off.
export default function MessageInput({
  onSend,
  busy = false,
  disabled = false,
  placeholder = "Type a message...",
  autoFocus = false,
}) {
  const [text, setText] = useState("");
  const inputId = useId();

  function handleSubmit(e) {
    e.preventDefault();
    if (busy || disabled || !text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        Message
      </label>
      <input
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      <button className="btn btn-primary" type="submit" disabled={disabled || busy || !text.trim()}>
        Send
      </button>
    </form>
  );
}
