import { ACCENT_PRESETS } from "../../lib/accents.js";
import "../../styles/features.css";

// Preset swatches plus a custom color. It only shows and reports the choice;
// the caller decides where the color is stored.
export default function ColorPicker({ value, onChange, onReset = null, note = null, error = null }) {
  const current = (value ?? "").toLowerCase();
  return (
    <div className="colorpicker">
      <div className="accent__swatches" role="group" aria-label="Preset colors">
        {ACCENT_PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            className="accent__swatch"
            style={{ background: p.hex }}
            aria-label={p.name}
            aria-pressed={current === p.hex.toLowerCase()}
            title={p.name}
            onClick={() => onChange(p.hex)}
          />
        ))}
      </div>

      <label className="accent__custom">
        <span>Custom color</span>
        <input type="color" value={value ?? "#FFFFFF"} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      </label>

      {note && <p className="muted small">{note}</p>}
      {error && (
        <p className="setup-error small" role="alert">
          {error}
        </p>
      )}
      {onReset && (
        <button type="button" className="btn btn-quiet" onClick={onReset}>
          Reset to default
        </button>
      )}
    </div>
  );
}
