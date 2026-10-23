export function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton-line" style={{ width: "70%" }} />
      <div className="skeleton-line" style={{ width: "90%" }} />
      <div className="skeleton-line" style={{ width: "55%" }} />
    </div>
  );
}

// Says what went wrong and what to do about it.
export function ErrorState({ detail, onRetry, retrying }) {
  return (
    <div className="error-state" role="alert">
      <p>Couldn't load this. The data service may be busy, so try again in a moment.</p>
      {detail && <p className="muted small">{detail}</p>}
      <button className="btn" onClick={() => onRetry()} disabled={retrying}>
        {retrying ? "Retrying..." : "Try again"}
      </button>
    </div>
  );
}
