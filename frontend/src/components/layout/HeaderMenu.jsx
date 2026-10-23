import { useEffect, useRef, useState } from "react";

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "Match my device" },
];

export default function HeaderMenu({ theme, onThemeChange, onEdit, busy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
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
    <div className="menu" ref={ref}>
      <button
        className="btn btn-quiet"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Menu
      </button>
      {open && (
        <div className="menu__panel" role="menu">
          <p className="menu__heading">Theme</p>
          {THEMES.map((t) => (
            <button
              key={t.value}
              role="menuitemradio"
              aria-checked={theme === t.value}
              className="menu__item"
              onClick={() => onThemeChange(t.value)}
            >
              <span>{t.label}</span>
              {theme === t.value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
          <hr className="menu__divider" />
          <button
            role="menuitem"
            className="menu__item"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit dashboard
          </button>
        </div>
      )}
    </div>
  );
}
