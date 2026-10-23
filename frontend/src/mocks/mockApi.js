// Fake backend for building the UI without API keys.
// All teams, players, and results here are FICTIONAL sample data.
// Response shapes match backend_v2.py exactly.

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 1500;
const ERROR_RATE = 0.1; // chance a widget fails, to exercise error states. Set to 0 to turn off.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => sleep(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));

function isoDaysFromNow(days, hour = 15, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------- sample data
const COMPETITION = { code: "DEMO", name: "Demo League", area: "Sampleland" };

const TEAMS = [
  { id: 1, name: "Riverside FC", short: "Riverside", tla: "RIV" },
  { id: 2, name: "Harbor United", short: "Harbor", tla: "HAR" },
  { id: 3, name: "Summit Rovers", short: "Summit", tla: "SUM" },
  { id: 4, name: "Northgate Athletic", short: "Northgate", tla: "NOR" },
  { id: 5, name: "Lakeside Town", short: "Lakeside", tla: "LAK" },
  { id: 6, name: "Valley Wanderers", short: "Valley", tla: "VAL" },
  { id: 7, name: "Ironbridge City", short: "Ironbridge", tla: "IRO" },
  { id: 8, name: "Oakfield Albion", short: "Oakfield", tla: "OAK" },
  { id: 9, name: "Westport Rangers", short: "Westport", tla: "WES" },
  { id: 10, name: "Eastvale Dynamos", short: "Eastvale", tla: "EAS" },
].map((t) => ({ ...t, competitions: ["DEMO"] }));

const teamName = (id) => TEAMS.find((t) => t.id === id)?.name ?? "Unknown";

// [team_id, played, won, draw, lost, goal difference], already in table order
const TABLE_SOURCE = [
  [2, 10, 7, 2, 1, 14],
  [3, 10, 7, 1, 2, 9],
  [4, 10, 5, 3, 2, 8],
  [5, 10, 5, 2, 3, 5],
  [6, 10, 5, 1, 4, 2],
  [7, 10, 4, 3, 3, 1],
  [1, 10, 4, 1, 5, -2],
  [8, 10, 3, 3, 4, -4],
  [9, 10, 2, 2, 6, -9],
  [10, 10, 1, 1, 8, -24],
];

const FULL_TABLE = TABLE_SOURCE.map(([id, played, won, draw, lost, gd], i) => ({
  pos: i + 1,
  team_id: id,
  team: teamName(id),
  played,
  won,
  draw,
  lost,
  gd,
  points: won * 3 + draw,
}));

// Past matches per team, oldest first
const PAST = {
  1: [
    { days: -28, home: 1, away: 5, hg: 2, ag: 1 },
    { days: -21, home: 3, away: 1, hg: 3, ag: 0 },
    { days: -14, home: 1, away: 8, hg: 1, ag: 1 },
    { days: -7, home: 9, away: 1, hg: 0, ag: 2 },
    { days: -3, home: 1, away: 2, hg: 0, ag: 1 },
  ],
  2: [
    { days: -28, home: 2, away: 10, hg: 3, ag: 0 },
    { days: -21, home: 7, away: 2, hg: 1, ag: 1 },
    { days: -14, home: 2, away: 6, hg: 2, ag: 0 },
    { days: -7, home: 3, away: 2, hg: 2, ag: 1 },
    { days: -3, home: 1, away: 2, hg: 0, ag: 1 },
  ],
};

const SCORERS = [
  { player: "Luca Verano", team: "Harbor United", played: 10, goals: 9, assists: 3, penalties: 2 },
  { player: "Dmitri Kallas", team: "Summit Rovers", played: 10, goals: 8, assists: 5, penalties: 0 },
  { player: "Sven Aldrin", team: "Northgate Athletic", played: 9, goals: 7, assists: 2, penalties: 1 },
  { player: "Mateo Quillan", team: "Riverside FC", played: 10, goals: 6, assists: 6, penalties: 0 },
  { player: "Jonah Fairweather", team: "Lakeside Town", played: 10, goals: 6, assists: 1, penalties: 3 },
  { player: "Rafael Torren", team: "Valley Wanderers", played: 10, goals: 5, assists: 4, penalties: 0 },
  { player: "Kofi Anselm", team: "Harbor United", played: 10, goals: 5, assists: 7, penalties: 0 },
  { player: "Elias Brandt", team: "Ironbridge City", played: 8, goals: 4, assists: 2, penalties: 1 },
  { player: "Niko Harlan", team: "Oakfield Albion", played: 10, goals: 4, assists: 3, penalties: 0 },
  { player: "Teo Marchetti", team: "Westport Rangers", played: 10, goals: 3, assists: 4, penalties: 0 },
];

// ---------------------------------------------------------- derived helpers
function outcome(match, teamId) {
  const isHome = match.home === teamId;
  const mine = isHome ? match.hg : match.ag;
  const theirs = isHome ? match.ag : match.hg;
  return mine > theirs ? "W" : mine < theirs ? "L" : "D";
}

function recentResults(teamId, n = 5) {
  return (PAST[teamId] ?? []).slice(-n).map((m) => ({
    date: isoDaysFromNow(m.days),
    competition: COMPETITION.name,
    home: teamName(m.home),
    away: teamName(m.away),
    status: "FINISHED",
    score: `${m.hg}-${m.ag}`,
    outcome: outcome(m, teamId),
  }));
}

function nextMatch(teamId) {
  const upcoming = {
    1: { days: 3, hour: 15, home: 1, away: 7 },
    2: { days: 4, hour: 17, home: 10, away: 2 },
  }[teamId];
  if (!upcoming) return { info: "No scheduled matches found" };
  return {
    date: isoDaysFromNow(upcoming.days, upcoming.hour, 30),
    competition: COMPETITION.name,
    home: teamName(upcoming.home),
    away: teamName(upcoming.away),
    status: "SCHEDULED",
    score: null,
  };
}

function standings(highlightIds = [], top) {
  if (!top) return FULL_TABLE;
  const keep = new Set(highlightIds);
  return FULL_TABLE.filter((r) => r.pos <= top || keep.has(r.team_id));
}

function scorers(sortBy) {
  const rows = [...SCORERS];
  if (sortBy === "assists") rows.sort((a, b) => b.assists - a.assists);
  return rows;
}

function widgetData(w) {
  switch (w.type) {
    case "next_match":
      return nextMatch(w.team_id);
    case "recent_results":
      return recentResults(w.team_id, w.n ?? 5);
    case "standings":
      return standings(w.highlight_team_ids, w.top);
    case "top_scorers":
      return scorers("goals");
    case "top_assists":
      return scorers("assists");
    default:
      throw new Error(`Unknown widget type: ${w.type}`);
  }
}

// Mirrors build_widgets() in backend_v2.py
function buildWidgets(prefs) {
  const stats = new Set(prefs.stats);
  const teamIds = prefs.teams.map((t) => t.id);
  const widgets = [];

  for (const t of prefs.teams) {
    widgets.push({ id: `next_match:${t.id}`, type: "next_match", team_id: t.id, title: `${t.name}: next match` });
    if (stats.has("form")) {
      widgets.push({ id: `recent_results:${t.id}`, type: "recent_results", team_id: t.id, n: 5, title: `${t.name}: recent form` });
    }
  }
  for (const code of prefs.competitions) {
    if (stats.has("standings")) {
      widgets.push({ id: `standings:${code}`, type: "standings", competition: code, highlight_team_ids: teamIds, top: 5, title: `${code}: table` });
    }
    if (stats.has("goals")) {
      widgets.push({ id: `top_scorers:${code}`, type: "top_scorers", competition: code, title: `${code}: top scorers` });
    }
    if (stats.has("assists")) {
      widgets.push({ id: `top_assists:${code}`, type: "top_assists", competition: code, title: `${code}: assists among top scorers` });
    }
  }
  return widgets;
}

// ------------------------------------------------------------- mock "server"
const PREFERENCES = {
  teams: [
    { id: 1, name: "Riverside FC" },
    { id: 2, name: "Harbor United" },
  ],
  competitions: ["DEMO"],
  stats: ["form", "standings", "goals", "assists"],
};

// Starts onboarded so you see the dashboard first. "Edit my dashboard" resets this.
const state = { onboarded: true };

// ------------------------------------------------------- scripted mock agents
// The real agent lives in the backend. These fakes just let you test the chat UI.
const script = { step: 0, answers: [] };

function onboardingReply(messages) {
  const last = (messages[messages.length - 1]?.content ?? "").trim();
  if (messages.length === 1) {
    // A brand new conversation always starts from the top.
    script.step = 0;
    script.answers = [];
  }
  const reply = (answer, dashboard_updated = false) => ({ answer, dashboard_updated });

  switch (script.step) {
    case 0:
      script.step = 1;
      return reply("Hi! I'm here to set up your dashboard. First, which teams do you follow?");
    case 1:
      script.answers[0] = last;
      script.step = 2;
      return reply("Nice! Which leagues or competitions do you want to focus on?");
    case 2:
      script.answers[1] = last;
      script.step = 3;
      return reply(
        "Last question: which stats matter most to you? I can show recent form, the league table, " +
          "top scorers (goals), and assists. Possession isn't available on the free data plan."
      );
    case 3:
      script.answers[2] = last;
      script.step = 4;
      return reply(
        `Here's what I have:\n- Teams: ${script.answers[0]}\n- Leagues: ${script.answers[1]}\n` +
          `- Stats: ${script.answers[2]}\n\nShall I save this? (yes/no)`
      );
    default:
      if (/^\s*(y|yes|yeah|yep|sure|ok|okay)\b/i.test(last)) {
        state.onboarded = true;
        script.step = 0;
        return reply(
          "All set! (Mock mode: I'm loading the sample dashboard with fictional teams, whatever you picked.)",
          true
        );
      }
      script.step = 1;
      script.answers = [];
      return reply("No problem, let's redo it. Which teams do you follow?");
  }
}

function assistantReply(text) {
  const q = text.toLowerCase();
  const reply = (answer) => ({ answer: `${answer} (Sample data)`, dashboard_updated: false });

  if (q.includes("next")) {
    const m = nextMatch(1);
    return reply(`${m.home} play ${m.away} on ${new Date(m.date).toLocaleDateString()}.`);
  }
  if (q.includes("assist")) {
    const top = scorers("assists")[0];
    return reply(`${top.player} (${top.team}) leads the top scorers with ${top.assists} assists.`);
  }
  if (q.includes("table") || q.includes("top of") || q.includes("league")) {
    const first = FULL_TABLE[0];
    return reply(`${first.team} are top with ${first.points} points from ${first.played} games.`);
  }
  if (q.includes("scor") || q.includes("goal")) {
    const top = scorers("goals")[0];
    return reply(`${top.player} (${top.team}) leads with ${top.goals} goals.`);
  }
  return reply(`I can answer questions about fixtures, the table, scorers, and assists. You asked: "${text}".`);
}

export const api = {
  async getDashboard() {
    await sleep(300);
    if (!state.onboarded) return { onboarded: false };
    return { onboarded: true, preferences: PREFERENCES, widgets: buildWidgets(PREFERENCES) };
  },

  async getWidgetData(widget) {
    await randomDelay();
    if (Math.random() < ERROR_RATE) {
      return { id: widget.id, error: "Sample error (mock mode): this widget couldn't load." };
    }
    try {
      return { id: widget.id, data: widgetData(widget) };
    } catch (e) {
      return { id: widget.id, error: e.message };
    }
  },

  async search(q) {
    await sleep(200);
    const query = q.trim().toLowerCase();
    if (!query) return { teams: [], competitions: [] };
    const matches = (fields) => fields.some((f) => f.toLowerCase().includes(query));
    return {
      teams: TEAMS.filter((t) => matches([t.name, t.short, t.tla])).slice(0, 8),
      competitions: matches([COMPETITION.name, COMPETITION.code, COMPETITION.area]) ? [COMPETITION] : [],
    };
  },

  async getTeam(id) {
    await randomDelay();
    return { next_match: nextMatch(Number(id)), recent_results: recentResults(Number(id), 5) };
  },

  async getCompetition() {
    await randomDelay();
    return { standings: FULL_TABLE, top_scorers: scorers("goals") };
  },

  async chat(mode, messages) {
    await randomDelay();
    if (mode === "onboarding") return onboardingReply(messages);
    return assistantReply(messages[messages.length - 1]?.content ?? "");
  },

  async getPreferences() {
    await sleep(200);
    return { preferences: state.onboarded ? PREFERENCES : null };
  },

  async resetPreferences() {
    await sleep(200);
    state.onboarded = false;
    return { ok: true };
  },
};
