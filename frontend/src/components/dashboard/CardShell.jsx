import { useAssistant } from "../../context/AssistantContext.jsx";

// The frame around a widget: a title, an optional small label, and an "Ask about this" link
// that opens the assistant with a ready-made question.
export default function CardShell({ title, meta, askPrompt, children }) {
  const { ask, enabled } = useAssistant();
  return (
    <section className="card">
      <header className="card__head">
        <h3 className="card__title">
          {title}
          {meta && <span className="card__meta">{meta}</span>}
        </h3>
        {askPrompt && enabled && (
          <button
            className="ask-link"
            onClick={() => ask(askPrompt)}
            aria-label={`Ask the assistant: ${askPrompt}`}
          >
            Ask about this
          </button>
        )}
      </header>
      {children}
    </section>
  );
}
