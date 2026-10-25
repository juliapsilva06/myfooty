import { useEffect, useRef, useState } from "react";
import "../../styles/features.css";

// A small panel on the countdown for choosing a picture of your team.
export default function HeroBackgroundMenu({ hasImage, error, onFile, onUrl, onClear }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const rootRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hero__bg" ref={rootRef}>
      <button className="hero__bg-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {hasImage ? "Change background" : "Add a background"}
      </button>

      {open && (
        <div className="hero__bg-panel" role="dialog" aria-label="Countdown background">
          <p className="small">Use a picture of your team.</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = ""; // lets you pick the same file again
            }}
          />
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Upload a picture
          </button>

          <label className="small" htmlFor="hero-bg-url">
            Or paste a picture link
          </label>
          <div className="hero__bg-row">
            <input
              id="hero-bg-url"
              className="setup-search"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                if (onUrl(url)) {
                  setUrl("");
                  setOpen(false);
                }
              }}
            >
              Use
            </button>
          </div>

          {hasImage && (
            <button className="btn btn-quiet" onClick={onClear}>
              Remove picture
            </button>
          )}
          {error && (
            <p className="setup-error small" role="alert">
              {error}
            </p>
          )}
          <p className="muted small">Pictures stay in this browser. Only use images you have the right to use.</p>
        </div>
      )}
    </div>
  );
}
