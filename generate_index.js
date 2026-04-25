import fs from "fs";
import { marked } from "marked";

const exclude = [
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "README.md",
  "schedule.md",
];

const files = fs
  .readdirSync("./", {})
  .filter((file) => file.endsWith(".md"))
  .filter((file) => !exclude.includes(file))
  .map((file) => {
    const md = fs.readFileSync(file, "utf8");
    return {
      filename: file,
      title: md.match(/(?<=^title: ).*$/gim)?.[0] ?? file.replace(".md", ""),
      description: md.match(/(?<=^description: ).*$/gim)?.[0] ?? "",
      video_embed: md.match(/(?<=^video_embed: ).*$/gim)?.[0] ?? "",
      mtime: fs.statSync(file).mtime.getTime(),
    };
  })
  .sort((a, b) => b.mtime - a.mtime);

const govUkTalks = files.filter(
  (file) =>
    file.filename.startsWith("CDDO-") || file.filename.startsWith("GDS-"),
);
const otherTalks = files.filter(
  (file) =>
    !file.filename.startsWith("CDDO-") && !file.filename.startsWith("GDS-"),
);

let scheduleSelect = "future";
const schedule = fs.readFileSync("schedule.md", "utf8");

// We only need the side effect of collecting rows that match the active
// `scheduleSelect`. Don't override `table` — the default table() iterates
// rows/cells and calls our overrides. marked v18 passes tokens; v12 passes
// strings. Handle both.
const scheduleRows = [];
const renderer = {
  tablerow(arg) {
    const text = typeof arg === "string" ? arg : arg.text;
    const date = ((text && text.match(/\d{4}-\d{2}-\d{2}/g)) || [])[0];
    if (!date) return "";
    const isFuture = Date.parse(date) > Date.now();
    if (
      (scheduleSelect === "future" && isFuture) ||
      (scheduleSelect === "past" && !isFuture)
    ) {
      scheduleRows.push(`<tr>${text}</tr>`);
    }
    return "";
  },
  tablecell(arg, flags) {
    if (typeof arg === "string") {
      const tag = flags && flags.header ? "th" : "td";
      return `<${tag}>${arg}</${tag}>`;
    }
    const tag = arg.header ? "th" : "td";
    const inner =
      this.parser && arg.tokens
        ? this.parser.parseInline(arg.tokens)
        : arg.text || "";
    return `<${tag}>${inner}</${tag}>`;
  },
};
marked.use({ renderer });

scheduleRows.length = 0;
scheduleSelect = "future";
marked.parse(schedule);
const futureRows = [...scheduleRows];

scheduleRows.length = 0;
scheduleSelect = "past";
marked.parse(schedule);
const pastRows = [...scheduleRows].reverse();

const renderTable = (rows) => `
<table class="data-table">
  <thead><tr><th scope="col">Date</th><th scope="col">Talk</th><th scope="col">Where</th></tr></thead>
  <tbody>${rows.join("\n")}</tbody>
</table>`;

const totalCount = files.length;

const youtubeWatchUrl = (embed) => {
  if (!embed) return null;
  const m = embed.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
};

const renderTalkCard = (file, index) => {
  const slug = file.filename.replace(".md", "");
  const num = String(index + 1).padStart(2, "0");
  const ytUrl = youtubeWatchUrl(file.video_embed);
  const primaryHref = ytUrl || `${slug}.html`;
  const media = file.video_embed
    ? `<div class="card-media card-media--video">${file.video_embed}</div>`
    : `<a class="card-media" href="${primaryHref}"><img src="${slug}.png" alt="${file.title}" loading="lazy" onerror="this.parentElement.classList.add('card-media--placeholder');this.remove();"></a>`;
  return `
<article class="talk-card">
  <div class="talk-card__num">No.${num}</div>
  ${media}
  <div class="talk-card__body">
    <h3 class="talk-card__title"><a class="talk-card__link" href="${primaryHref}">${file.title}</a></h3>
    ${file.description ? `<p class="talk-card__desc">${file.description}</p>` : ""}
    <div class="talk-card__meta">
      <a href="${slug}.html" title="${file.title} HTML deck"><span class="fmt">HTML</span></a>
      <a href="${slug}.pdf" title="${file.title} PDF deck"><span class="fmt">PDF</span></a>
      <a href="${slug}.pptx" title="${file.title} PPTX deck"><span class="fmt">PPTX</span></a>
      <a href="${slug}.txt" title="${file.title} notes"><span class="fmt">TXT</span></a>
    </div>
  </div>
</article>`;
};

// SVG noise texture for paper grain — embedded so we don't need an extra request
const grainSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>`,
)}`;

const css = `
:root {
  --paper: #efe6cf;
  --paper-2: #e6dcc1;
  --paper-deep: #d8ccae;
  --ink: #15110a;
  --ink-2: #2a2218;
  --ink-soft: #6a5a45;
  --ink-mute: #968570;
  --rule: rgba(21, 17, 10, 0.18);
  --rule-strong: rgba(21, 17, 10, 0.55);
  --accent: #c0331c;
  --accent-deep: #8a2010;
  --gov: #1d4d3a;
  --maxw: 1320px;
  --gutter: 32px;
  --serif: "Fraunces", "Times New Roman", Times, serif;
  --sans: "Hanken Grotesk", -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--sans);
  color: var(--ink);
  background: var(--paper);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02", "kern", "liga";
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
/* paper grain + soft tonal vignette */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("${grainSvg}");
  background-size: 220px 220px;
  mix-blend-mode: multiply;
  opacity: 0.55;
  pointer-events: none;
  z-index: 1;
}
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(900px 600px at 88% -8%, rgba(192, 51, 28, 0.08), transparent 60%),
    radial-gradient(800px 700px at -10% 100%, rgba(29, 77, 58, 0.06), transparent 60%);
  pointer-events: none;
  z-index: 0;
}
main, header, footer { position: relative; z-index: 2; }

::selection { background: var(--accent); color: var(--paper); }

a { color: inherit; text-decoration: none; }

/* Reusable */
.wrap {
  max-width: var(--maxw);
  margin: 0 auto;
  padding-left: var(--gutter);
  padding-right: var(--gutter);
}
.rule {
  height: 1px;
  background: var(--ink);
  opacity: 0.85;
  border: 0;
  margin: 0;
}
.rule--double {
  height: 4px;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  background: transparent;
}
.rule--hair { background: var(--rule); opacity: 1; }

.section-label {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ink);
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.section-label .pilcrow {
  color: var(--accent);
  font-style: italic;
  font-family: var(--serif);
  font-size: 14px;
  font-weight: 500;
}

/* Masthead */
.masthead {
  padding-top: 18px;
}
.masthead-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 12px 0;
  flex-wrap: wrap;
}
.masthead-row .brand {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: 18px;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--ink);
}
.masthead-row .sep { color: var(--ink-mute); }
.masthead-row .grow { flex: 1; }
.masthead-row .stat strong {
  font-family: var(--serif);
  font-weight: 500;
  font-size: 14px;
  font-style: italic;
  text-transform: none;
  letter-spacing: -0.01em;
  color: var(--accent);
  margin-right: 4px;
}

.primary-nav {
  display: flex;
  align-items: center;
  gap: 4px 18px;
  padding: 10px 0;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  flex-wrap: wrap;
}
.primary-nav a {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  text-transform: uppercase;
}
.primary-nav a .num {
  color: var(--accent);
  font-style: italic;
  font-family: var(--serif);
  font-size: 13px;
  text-transform: none;
}
.primary-nav a:hover { color: var(--accent); border-color: var(--accent); }
.primary-nav a.active { border-color: var(--ink); }
.primary-nav .external::after {
  content: "↗";
  font-family: var(--serif);
  margin-left: 2px;
  color: var(--ink-soft);
}
.primary-nav .grow { flex: 1; }
.primary-nav .ts {
  color: var(--ink-mute);
  font-size: 11px;
  letter-spacing: 0.18em;
}

/* Hero */
.hero {
  padding: 48px 0 56px;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  grid-template-areas: 'left portrait';
  gap: 48px;
  align-items: stretch;
}
.hero-left { grid-area: left; }
.hero-portrait { grid-area: portrait; }
.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}
.hero-headline {
  font-family: var(--serif);
  font-weight: 400;
  letter-spacing: -0.022em;
  font-size: clamp(48px, 6.4vw, 104px);
  line-height: 0.95;
  margin: 18px 0 0;
  font-feature-settings: "ss01", "kern", "liga";
  text-wrap: balance;
}
.hero-headline em {
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
  display: inline-block;
  /* gives the italic a touch more presence at huge sizes */
  font-variation-settings: "opsz" 144, "SOFT" 100;
}
.hero-headline .ampersand {
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
  font-size: 0.9em;
  vertical-align: -0.04em;
}
.hero-headline .indent { padding-left: 1em; }
.hero-headline .indent-2 { padding-left: 2em; }
.hero-lede {
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(18px, 1.9vw, 22px);
  line-height: 1.45;
  max-width: 38ch;
  color: var(--ink-2);
  margin: 0;
  letter-spacing: -0.005em;
}
.hero-lede::first-letter {
  font-weight: 400;
  font-size: 1.15em;
}
.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.14em;
  padding: 12px 18px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  border-radius: 0;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
  cursor: pointer;
  position: relative;
}
.btn::after {
  content: "→";
  font-family: var(--serif);
  font-style: italic;
  font-size: 14px;
  letter-spacing: 0;
  transition: transform 0.2s ease;
}
.btn:hover { background: var(--ink); color: var(--paper); }
.btn:hover::after { transform: translateX(3px); }
.btn--accent { background: var(--accent); color: var(--paper); border-color: var(--accent); }
.btn--accent:hover { background: var(--ink); border-color: var(--ink); color: var(--paper); }
.btn--quiet { border-color: var(--rule-strong); }

/* Hero portrait — frame + caption like a photo plate */
.hero-portrait {
  display: grid;
  grid-template-rows: auto auto;
  align-self: stretch;
  align-content: end;
  gap: 10px;
}
.portrait-frame {
  position: relative;
  background: var(--paper-2);
  border: 1px solid var(--ink);
  padding: 8px;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  max-width: 360px;
  margin-left: auto;
  box-shadow:
    -8px 8px 0 0 var(--paper-deep),
    -8px 8px 0 1px var(--ink);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.portrait-frame:hover {
  transform: translate(2px, -2px);
  box-shadow:
    -12px 12px 0 0 var(--paper-deep),
    -12px 12px 0 1px var(--ink);
}
.portrait-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 18%;
  filter: contrast(1.04) saturate(0.92) sepia(0.05);
}
.portrait-frame::after {
  content: "";
  position: absolute;
  inset: 10px;
  background: linear-gradient(160deg, transparent 60%, rgba(21, 17, 10, 0.18) 100%);
  pointer-events: none;
}
.portrait-cap {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.portrait-cap em {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 300;
  text-transform: none;
  letter-spacing: 0;
  color: var(--accent);
  font-size: 13px;
}

/* Section heads */
.section {
  padding: 56px 0 24px;
}
.section-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ink);
  margin-bottom: 28px;
}
.section-title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(34px, 4.6vw, 64px);
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 6px 0 0;
}
.section-title em { font-style: italic; color: var(--accent); font-weight: 300; }
.section-meta {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-align: right;
}
.section-meta strong {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  font-size: 22px;
  letter-spacing: -0.01em;
  color: var(--accent);
  text-transform: none;
  margin-right: 4px;
}

/* Talks grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 28px 24px;
}
.talk-card {
  grid-column: span 4;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: 18px;
  border-top: 1px solid var(--ink);
  isolation: isolate;
}
.talk-card__num {
  position: absolute;
  top: 18px;
  right: 0;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.card-media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--paper-2);
  border: 1px solid var(--ink);
  margin-bottom: 16px;
  display: block;
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: var(--paper-2);
  filter: contrast(1.02) saturate(0.95);
  transition: transform 0.5s ease;
}
.talk-card:hover .card-media img { transform: scale(1.015); }
.card-media iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.card-media--video { aspect-ratio: 16 / 9; }
.card-media--placeholder {
  background:
    repeating-linear-gradient(135deg, var(--paper-2) 0 12px, var(--paper-deep) 12px 13px);
  position: relative;
}
.card-media--placeholder::after {
  content: "/dev/null";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
  opacity: 0.7;
}

.talk-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
}
.talk-card__title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: 22px;
  line-height: 1.12;
  letter-spacing: -0.018em;
  margin: 0;
  text-wrap: balance;
}
.talk-card__link {
  position: relative;
  display: inline;
  color: inherit;
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-size: 0% 1px;
  background-position: 0 100%;
  transition: background-size 0.4s ease, color 0.15s ease;
  padding-bottom: 2px;
}
/* stretched link makes the whole card clickable, while format buttons
   sit above on a higher z-index */
.talk-card__link::before {
  content: "";
  position: absolute;
  inset: -18px 0 0 0;
  z-index: 1;
}
.talk-card:hover .talk-card__link { background-size: 100% 2px; }
.talk-card:hover .talk-card__link { color: var(--ink); }
.talk-card__body { position: relative; }
.talk-card__meta { position: relative; z-index: 2; }
.card-media { position: relative; z-index: 2; }
.card-media iframe { z-index: 3; }
.talk-card__desc {
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--ink-2);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.talk-card__meta {
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  gap: 14px;
  align-items: baseline;
  border-top: 1px dashed var(--rule);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.talk-card__meta a {
  color: var(--ink-soft);
  transition: color 0.15s ease;
  position: relative;
}
.talk-card__meta a:hover { color: var(--accent); }
.talk-card__meta a:hover::before {
  content: "›";
  position: absolute;
  left: -10px;
  color: var(--accent);
  font-family: var(--serif);
}

/* gov.uk band */
.gov-band {
  margin: 64px 0 28px;
  padding: 22px 0;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}
.gov-band .crown {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  color: var(--gov);
  font-size: 28px;
  letter-spacing: -0.01em;
}
.gov-band .band-title {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(28px, 3.5vw, 44px);
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0;
}
.gov-band .band-title em { font-style: italic; color: var(--gov); font-weight: 300; }
.gov-band .band-meta {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-align: right;
}

/* Schedule */
.schedule {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
.schedule-pane h3 {
  font-family: var(--serif);
  font-weight: 400;
  font-size: 32px;
  letter-spacing: -0.018em;
  margin: 0 0 12px;
}
.schedule-pane h3 em { font-style: italic; color: var(--accent); font-weight: 300; }
.pane-meta {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 14px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12.5px;
  border-top: 2px solid var(--ink);
}
.data-table thead th {
  text-align: left;
  font-family: var(--mono);
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--ink);
  background: transparent;
  position: sticky;
  top: 0;
  background-color: var(--paper);
}
.data-table tbody td {
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--rule);
  vertical-align: top;
  color: var(--ink-2);
}
.data-table tbody td:first-child {
  white-space: nowrap;
  color: var(--ink);
  font-weight: 500;
  font-feature-settings: "tnum" 1;
}
.data-table tbody td:nth-child(2) {
  font-family: var(--serif);
  font-size: 14.5px;
  letter-spacing: -0.005em;
  color: var(--ink);
  line-height: 1.35;
}
.data-table tbody td a {
  color: var(--accent);
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}
.data-table tbody td a:hover { border-color: var(--accent); }
.data-table tbody tr:hover td { background: rgba(192, 51, 28, 0.04); }
.scroll {
  max-height: 480px;
  overflow-y: auto;
  border-bottom: 1px solid var(--ink);
}
.scroll::-webkit-scrollbar { width: 12px; }
.scroll::-webkit-scrollbar-track { background: transparent; }
.scroll::-webkit-scrollbar-thumb {
  background: var(--ink);
  border: 4px solid var(--paper);
}

.empty-pane {
  border: 1px dashed var(--rule-strong);
  padding: 36px 24px;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 300;
  font-size: 18px;
  line-height: 1.5;
  color: var(--ink-2);
  background:
    repeating-linear-gradient(135deg, transparent 0 12px, rgba(21, 17, 10, 0.03) 12px 13px);
}
.empty-pane a { color: var(--accent); border-bottom: 1px solid var(--accent); }
.empty-pane a:hover { color: var(--ink); border-color: var(--ink); }

/* Footer / colophon */
.colophon {
  margin-top: 64px;
  border-top: 4px double var(--ink);
  padding: 36px 0 56px;
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 32px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}
.colophon h4 {
  margin: 0 0 12px;
  font-family: var(--mono);
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink);
}
.colophon a {
  color: var(--ink);
  border-bottom: 1px solid var(--rule-strong);
  transition: color 0.15s ease, border-color 0.15s ease;
}
.colophon a:hover { color: var(--accent); border-color: var(--accent); }
.colophon p { margin: 0 0 8px; }
.colophon em {
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--ink);
}

/* Decorative big numerals (subtle) */
.section-deco {
  position: absolute;
  font-family: var(--serif);
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
  opacity: 0.08;
  font-size: clamp(160px, 22vw, 320px);
  line-height: 1;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

/* Reveal animation on load — staggered */
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.rise { animation: rise 0.7s ease both; }
.rise-1 { animation-delay: 0.05s; }
.rise-2 { animation-delay: 0.15s; }
.rise-3 { animation-delay: 0.25s; }
.rise-4 { animation-delay: 0.35s; }
.rise-5 { animation-delay: 0.45s; }

@media (prefers-reduced-motion: reduce) {
  .rise { animation: none; }
}

/* Responsive */
@media (max-width: 1080px) {
  .hero {
    grid-template-columns: 1fr;
    grid-template-areas: 'left' 'portrait';
    gap: 28px;
  }
  .hero-portrait { max-width: 320px; }
  .talk-card { grid-column: span 6; }
}
@media (max-width: 720px) {
  :root { --gutter: 20px; }

  /* Tighter masthead */
  .masthead { padding-top: 12px; }
  .masthead-row { padding: 8px 0; gap: 8px 10px; font-size: 10px; }
  .masthead-row .brand { font-size: 15px; }
  .primary-nav { padding: 8px 0; gap: 4px 14px; font-size: 11px; }
  .primary-nav .ts { display: none; }

  /* Hero: portrait floats top-right, headline wraps around it */
  .hero {
    display: block;
    padding: 18px 0 24px;
  }
  .hero-portrait {
    float: right;
    width: 118px;
    margin: 6px 0 8px 16px;
    max-width: 118px;
    shape-outside: margin-box;
  }
  .portrait-frame {
    aspect-ratio: 4 / 5;
    padding: 5px;
    max-width: 118px;
    margin: 0;
    box-shadow:
      -5px 5px 0 0 var(--paper-deep),
      -5px 5px 0 1px var(--ink);
  }
  .portrait-cap {
    margin-top: 6px;
    font-size: 9.5px;
    letter-spacing: 0.12em;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }
  .portrait-cap em { font-size: 11px; }
  .portrait-cap span:last-child { color: var(--accent); }

  .hero-left { display: block; }
  .hero-headline {
    font-size: clamp(38px, 10.6vw, 56px);
    line-height: 0.98;
    margin-top: 6px;
    letter-spacing: -0.025em;
  }
  .hero-headline .indent, .hero-headline .indent-2 { padding-left: 0; }
  .hero-lede {
    clear: right;
    font-size: 16px;
    line-height: 1.45;
    margin-top: 18px;
  }
  .hero-actions { margin-top: 16px !important; }
  .btn { padding: 10px 14px; font-size: 11px; }

  /* Sections breathe less */
  .section { padding: 36px 0 16px; }
  .section-head { padding-bottom: 10px; margin-bottom: 18px; }
  .section-title { font-size: clamp(30px, 8.8vw, 44px); }
  .section-meta { font-size: 10px; }

  /* Cards stack */
  .talk-card { grid-column: span 12; }
  /* Gov band & schedule & colophon */
  .gov-band {
    margin: 36px 0 18px;
    padding: 16px 0;
    grid-template-columns: auto 1fr;
    gap: 14px;
  }
  .gov-band .band-meta { display: none; }
  .gov-band .band-title { font-size: 28px; }

  .schedule { grid-template-columns: 1fr; gap: 22px; }
  .schedule-pane h3 { font-size: 26px; }

  .colophon {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 28px 0 40px;
    margin-top: 40px;
  }
}
@media (max-width: 420px) {
  .hero-portrait { width: 104px; margin-left: 12px; }
  .portrait-frame { padding: 4px; max-width: 104px; }
  .hero-headline { font-size: 40px; }
  .section-title { font-size: 32px; }
}
`;

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Chris Nesbitt-Smith — talks about software development</title>
<meta name="title" content="Chris Nesbitt-Smith talks about software development" />
<meta name="description" content="Talks by Chris Nesbitt-Smith on Kubernetes, platform engineering, policy as code, and digital government." />
<meta name="theme-color" content="#efe6cf" />

<meta property="og:type" content="website" />
<meta property="og:url" content="http://talks.cns.me/" />
<meta property="og:title" content="Chris Nesbitt-Smith talks about software development" />
<meta property="og:description" content="Talks by Chris Nesbitt-Smith on Kubernetes, platform engineering, policy as code, and digital government." />
<meta property="og:image" content="https://talks.cns.me/images/me.png" />

<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="http://talks.cns.me/" />
<meta property="twitter:title" content="Chris Nesbitt-Smith talks about software development" />
<meta property="twitter:description" content="Talks by Chris Nesbitt-Smith on Kubernetes, platform engineering, policy as code, and digital government." />
<meta property="twitter:image" content="https://talks.cns.me/images/me.png" />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,30..100;1,9..144,300..600,30..100&family=Hanken+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<style>${css}</style>

<script async src="https://www.googletagmanager.com/gtag/js?id=G-BF3VN6JZZG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BF3VN6JZZG');
</script>
</head>`;

const otherCardsHtml = otherTalks
  .map((f, i) => renderTalkCard(f, i))
  .join("\n");

const govCardsHtml = govUkTalks
  .map((f, i) => renderTalkCard(f, otherTalks.length + i))
  .join("\n");

const body = `
<body>
<header class="masthead">
  <div class="wrap">
    <hr class="rule rule--double" />
    <div class="masthead-row">
      <a class="brand" href="/">Chris Nesbitt&#8209;Smith</a>
      <span class="sep">·</span>
      <span>A back catalogue</span>
      <span class="sep">·</span>
      <span>Est. MMXXI</span>
      <span class="grow"></span>
      <span class="stat"><strong>${totalCount}</strong>indexed</span>
    </div>
    <hr class="rule rule--hair" />
    <nav class="primary-nav" aria-label="Primary">
      <a class="active" href="#talks"><span class="num">§01</span>Talks</a>
      <a href="#govuk"><span class="num">§02</span>gov.uk</a>
      <a href="#schedule"><span class="num">§03</span>Schedule</a>
      <span class="grow"></span>
      <a class="external" href="https://cns.me">LinkedIn</a>
      <a class="external" href="https://blogs.cns.me">Blog</a>
      <a class="external" href="https://devpsyops.com">DevPsyOps</a>
      <a class="external" href="https://github.com/chrisns">GitHub</a>
      <span class="ts">talks.cns.me</span>
    </nav>
    <hr class="rule" />
  </div>
</header>

<main>
<section class="wrap">
  <div class="hero">
    <aside class="hero-portrait rise rise-2">
      <div class="portrait-frame">
        <img src="images/me.png" alt="Chris Nesbitt-Smith" />
      </div>
      <div class="portrait-cap">
        <span>Plate I — <em>The author</em></span>
        <span>Available for talks</span>
      </div>
    </aside>
    <div class="hero-left">
      <div class="rise rise-1">
        <span class="section-label"><span class="pilcrow">§00</span> Introduction · By the Author</span>
        <h1 class="hero-headline">
          Talks on
          <span class="indent"><em>Kubernetes,</em></span>
          <span class="indent-2">platforms</span>
          <span><span class="ampersand">&amp;</span> digital&nbsp;<em>government.</em></span>
        </h1>
      </div>
      <div class="rise rise-3">
        <p class="hero-lede">A working back catalogue of conference talks, workshops and webinars — covering platform engineering, policy as code, multi&#8209;tenancy, and the realities of building digital services for the public.</p>
        <div class="hero-actions" style="margin-top:22px;">
          <a class="btn btn--accent" href="#talks">Browse the catalogue</a>
          <a class="btn btn--quiet" href="#schedule">See schedule</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="wrap section" id="talks">
  <div class="section-head">
    <div>
      <span class="section-label"><span class="pilcrow">§01</span> Selected talks</span>
      <h2 class="section-title">A working <em>catalogue</em>.</h2>
    </div>
    <div class="section-meta"><strong>${otherTalks.length}</strong>entries / curated</div>
  </div>
  <div class="grid">
    ${otherCardsHtml}
  </div>

${
  govUkTalks.length
    ? `
  <div id="govuk" class="gov-band">
    <span class="crown">❦</span>
    <h3 class="band-title">UK <em>gov</em>.</h3>
    <span class="band-meta">§02 — DSIT / GDS / CDDO</span>
  </div>
  <div class="grid">
    ${govCardsHtml}
  </div>`
    : ""
}
</section>

<section class="wrap section" id="schedule">
  <div class="section-head">
    <div>
      <span class="section-label"><span class="pilcrow">§03</span> Schedule</span>
      <h2 class="section-title">Where <em>next</em>, where <em>recently</em>.</h2>
    </div>
    <div class="section-meta">UTC · listed reverse-chron</div>
  </div>
  <div class="schedule">
    <div class="schedule-pane">
      <h3>Upcoming</h3>
      <div class="pane-meta">${futureRows.length} confirmed</div>
      ${
        futureRows.length
          ? `<div class="scroll">${renderTable(futureRows)}</div>`
          : `<div class="empty-pane">Nothing on the books just now. <a href="mailto:chris@cns.me">Get in touch</a> if you'd like to invite me to speak — workshops, conferences, podcasts, or in-house briefings.</div>`
      }
    </div>
    <div class="schedule-pane">
      <h3>Recent</h3>
      <div class="pane-meta">${pastRows.length} archived · newest first</div>
      <div class="scroll">${renderTable(pastRows)}</div>
    </div>
  </div>
</section>
</main>

<footer class="wrap colophon">
  <div>
    <h4>Colophon</h4>
    <p>Set in <em>Fraunces</em>, Hanken Grotesk &amp; JetBrains Mono. Hand-built; statically typeset. Source on <a href="https://github.com/chrisns/talks">GitHub</a>.</p>
    <p>© ${new Date().getFullYear()} Chris Nesbitt&#8209;Smith — all words my own.</p>
  </div>
  <div>
    <h4>Elsewhere</h4>
    <p><a href="https://cns.me">LinkedIn / cns.me</a></p>
    <p><a href="https://blogs.cns.me">Blog</a></p>
    <p><a href="https://devpsyops.com">DevPsyOps</a></p>
    <p><a href="https://github.com/chrisns">GitHub</a></p>
  </div>
  <div>
    <h4>Bookings</h4>
    <p>Conferences, in-house workshops, podcasts and the occasional debate. Drop a line at <a href="mailto:chris@cns.me">chris@cns.me</a>.</p>
  </div>
</footer>
</body>
</html>`;

process.stdout.write(head + body);
