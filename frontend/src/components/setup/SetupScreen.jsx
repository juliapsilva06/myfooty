import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import { defaultAccent, storedAccent } from "../../lib/accents.js";
import { saveAccent } from "../../lib/accentStore.js";
import { teamCode } from "../../lib/teamCode.js";
import ColorPicker from "../common/ColorPicker.jsx";
import Monogram from "../common/Monogram.jsx";
import Brand from "../layout/Brand.jsx";
import "../../styles/features.css";

const DEFAULT_STATS = ["form", "standings", "goals"];

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function toggled(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// Picking teams, leagues, and stats with a search box and checkboxes. No AI involved,
// so this works on the free plan. With `initial`, it edits an existing dashboard.
export default function SetupScreen({ initial = null, onCancel = null, onSaved = null }) {
  const queryClient = useQueryClient();
  const [teams, setTeams] = useState(initial?.teams ?? []);
  const [comps, setComps] = useState(() => new Set(initial?.competitions ?? []));
  const [stats, setStats] = useState(() => new Set(initial?.stats?.length ? initial.stats : DEFAULT_STATS));
  const [query, setQuery] = useState("");
  // Colors picked here, by team id. A team with no pick shows (and keeps) the default for its position.
  const [colors, setColors] = useState(() =>
    Object.fromEntries((initial?.teams ?? []).map((t) => [t.id, storedAccent(t.id)]).filter(([, hex]) => hex))
  );
  const [colorFor, setColorFor] = useState(null); // id of the team whose color panel is open
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const term = useDebounced(query.trim(), 250);
  const search = useQuery({
    queryKey: ["search", term],
    queryFn: () => api.search(term),
    enabled: term.length >= 2,
    staleTime: 60_000,
  });
  const competitions = useQuery({ queryKey: ["competitions"], queryFn: api.getCompetitions, staleTime: 3_600_000 });
  const statList = useQuery({ queryKey: ["stats"], queryFn: api.getStats, staleTime: 3_600_000 });

  const compList = competitions.data?.competitions ?? [];
  const compName = Object.fromEntries(compList.map((c) => [c.code, c.name]));
  const availableStats = Object.entries(statList.data?.available ?? {});
  const unavailableNames = Object.values(statList.data?.unavailable ?? {}).map((v) => v.split(":")[0]);
  const found = search.data?.teams ?? [];
  const canSave = teams.length > 0 || comps.size > 0;

  function addTeam(team) {
    if (teams.some((t) => t.id === team.id)) return;
    setTeams([...teams, { id: team.id, name: team.name, tla: team.tla || null }]); // keep the code so it matches everywhere
    // Tick the leagues this team plays in, so the table and leaders show up without extra clicks.
    setComps((prev) => {
      const next = new Set(prev);
      (team.competitions ?? []).forEach((code) => next.add(code));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Lock in every team's color, so colors never shift when you add or remove teams later.
      teams.forEach((t, i) => saveAccent(t.id, colors[t.id] ?? storedAccent(t.id) ?? defaultAccent(i)));
      const orderedStats = availableStats.length
        ? availableStats.map(([key]) => key).filter((key) => stats.has(key))
        : [...stats];
      const saved = await api.savePreferences({ teams, competitions: [...comps], stats: orderedStats });
      if (!saved) {
        throw new Error("Your browser is blocking saved settings, so the dashboard can't remember your choices.");
      }
      queryClient.removeQueries({ queryKey: ["widget"] }); // old card data belongs to old choices
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSaved?.();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="setup">
      <div className="setup__inner">
        <header className="setup__head">
          <Brand />
          <h2 className="setup__title">{initial ? "Edit your dashboard" : "Set up your dashboard"}</h2>
          <p className="muted">Choose the teams and leagues you follow. Everything else stays off the screen.</p>
        </header>

        <section className="setup__section" aria-labelledby="setup-teams">
          <h2 id="setup-teams">1. Your teams</h2>
          {teams.length > 0 && (
            <>
              <ul className="setup-chips" aria-label="Teams you picked">
                {teams.map((t, i) => (
                  <li key={t.id} className="setup-chip">
                    <button
                      className="setup-chip__color"
                      aria-label={`Change color for ${t.name}`}
                      aria-expanded={colorFor === t.id}
                      onClick={() => setColorFor(colorFor === t.id ? null : t.id)}
                    >
                      <Monogram code={teamCode(t)} size="sm" accent={colors[t.id] ?? storedAccent(t.id) ?? defaultAccent(i)} />
                    </button>
                    <span>{t.name}</span>
                    <button
                      className="setup-chip__remove"
                      aria-label={`Remove ${t.name}`}
                      onClick={() => {
                        setTeams(teams.filter((x) => x.id !== t.id));
                        if (colorFor === t.id) setColorFor(null);
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p className="muted small">Tap a team's circle to choose its color.</p>
              {colorFor != null && teams.some((t) => t.id === colorFor) && (
                <div className="setup-colorpanel" role="group" aria-label="Team color">
                  <p className="small">Color for {teams.find((t) => t.id === colorFor)?.name}</p>
                  <ColorPicker
                    value={
                      colors[colorFor] ??
                      storedAccent(colorFor) ??
                      defaultAccent(teams.findIndex((t) => t.id === colorFor))
                    }
                    onChange={(hex) => setColors((prev) => ({ ...prev, [colorFor]: hex }))}
                  />
                  <button className="btn" onClick={() => setColorFor(null)}>
                    Done
                  </button>
                </div>
              )}
            </>
          )}
          <label className="sr-only" htmlFor="team-search">
            Search for a team
          </label>
          <input
            id="team-search"
            className="setup-search"
            type="search"
            placeholder="Search for a team, like Barcelona"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div aria-live="polite">
            {term.length >= 2 && search.isLoading && <p className="muted small">Searching...</p>}
            {search.isError && (
              <p className="setup-error small" role="alert">
                Couldn't search right now. Check your connection and try again.
              </p>
            )}
            {search.isSuccess && found.length === 0 && (
              <p className="muted small">
                No teams found. If the site just started, the team list may still be loading, so try again in a minute.
              </p>
            )}
          </div>
          {found.length > 0 && (
            <ul className="setup-results">
              {found.map((t) => {
                const added = teams.some((x) => x.id === t.id);
                return (
                  <li key={t.id} className="setup-result">
                    <Monogram code={teamCode(t)} size="sm" />
                    <span className="setup-result__name">
                      <span>{t.name}</span>
                      <span className="muted small">{(t.competitions ?? []).map((c) => compName[c] ?? c).join(", ")}</span>
                    </span>
                    <button
                      className="btn"
                      disabled={added}
                      aria-label={added ? `${t.name} added` : `Add ${t.name}`}
                      onClick={() => addTeam(t)}
                    >
                      {added ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="setup__section" aria-labelledby="setup-leagues">
          <h2 id="setup-leagues">2. Your leagues</h2>
          <p className="muted small">Leagues for the teams you add are ticked for you. Add or remove any.</p>
          {competitions.isLoading && <p className="muted">Loading leagues...</p>}
          {competitions.isError && (
            <p className="setup-error small" role="alert">
              Couldn't load the league list.{" "}
              <button className="setup-chip__remove" onClick={() => competitions.refetch()}>
                Try again
              </button>
            </p>
          )}
          <div className="setup-grid">
            {compList.map((c) => (
              <label key={c.code} className="setup-check">
                <input
                  type="checkbox"
                  checked={comps.has(c.code)}
                  onChange={() => setComps(toggled(comps, c.code))}
                />
                <span>
                  {c.name}
                  <span className="muted small"> {c.area}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="setup__section" aria-labelledby="setup-stats">
          <h2 id="setup-stats">3. What to show</h2>
          {statList.isLoading && <p className="muted">Loading options...</p>}
          {statList.isError && (
            <p className="setup-error small" role="alert">
              Couldn't load the options.{" "}
              <button className="setup-chip__remove" onClick={() => statList.refetch()}>
                Try again
              </button>
            </p>
          )}
          <div className="setup-grid">
            {availableStats.map(([key, label]) => (
              <label key={key} className="setup-check">
                <input type="checkbox" checked={stats.has(key)} onChange={() => setStats(toggled(stats, key))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {unavailableNames.length > 0 && (
            <p className="muted small">Not available on the free data plan: {unavailableNames.join(", ")}.</p>
          )}
        </section>

        <footer className="setup-footer">
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Saving..." : initial ? "Save changes" : "Create my dashboard"}
          </button>
          {onCancel && (
            <button className="btn btn-quiet" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          )}
          {!canSave && <span className="muted small">Add at least one team or league.</span>}
          {error && (
            <span className="setup-error small" role="alert">
              {error}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}
