import { useEffect, useRef, useState } from "react";
import { usePreferences } from "../../context/PreferencesContext.jsx";
import ColorPicker from "../common/ColorPicker.jsx";
import "../../styles/features.css";

// "Team color" button on a team's page, with a panel to change it.
export default function AccentPicker({ team }) {
  const { accentOf, baseAccentOf, hasCustomAccent, setAccent, resetAccent } = usePreferences();
  const [open, setOpen] = useState(false);
  const [notSaved, setNotSaved] = useState(false);
  const rootRef = useRef(null);

  const shown = accentOf(team.id); // what is drawn on screen
  const chosen = baseAccentOf(team.id); // what was picked
  const adjusted = shown && chosen && shown.toLowerCase() !== chosen.toLowerCase();

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
    <div className="accent" ref={rootRef}>
      <button
        className="accent__btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="accent__dot" style={{ background: shown }} aria-hidden="true" />
        Team color
      </button>

      {open && (
        <div className="accent__panel" role="dialog" aria-label={`Color for ${team.name}`}>
          <ColorPicker
            value={chosen}
            onChange={(hex) => setNotSaved(!setAccent(team.id, hex))}
            onReset={
              hasCustomAccent(team.id)
                ? () => {
                    resetAccent(team.id);
                    setNotSaved(false);
                  }
                : null
            }
            note={adjusted ? "Shown a little lighter or darker than your pick so it stays readable on this theme." : null}
            error={
              notSaved ? "Your browser is blocking saved settings, so this color will reset when you close the page." : null
            }
          />
        </div>
      )}
    </div>
  );
}
