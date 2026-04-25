import fs from "fs";

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

// Schedule — direct parse of the pipe table; converts the leading
// `(v)|(irl)|(hybrid)` marker into a venue-mode chip.
const renderInline = (s) =>
  s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, text, url) => `<a href="${url}">${text}</a>`,
  );

const parseSchedule = (md) => {
  const rows = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (line.includes("---")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 3) continue;
    const [date, talk, whereRaw] = cells;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const m = whereRaw.match(/^\((v|irl|hybrid)\)\s*(.+)$/);
    const mode = m ? m[1] : null;
    const whereSrc = m ? m[2] : whereRaw;
    rows.push({
      date,
      talk,
      where: renderInline(whereSrc),
      mode,
    });
  }
  return rows;
};

const scheduleRecords = parseSchedule(fs.readFileSync("schedule.md", "utf8"));
const now = Date.now();
const futureRows = scheduleRecords
  .filter((r) => Date.parse(r.date) > now)
  .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
const pastRows = scheduleRecords
  .filter((r) => Date.parse(r.date) <= now)
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

const youtubeWatchUrl = (embed) => {
  if (!embed) return null;
  const m = embed.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
};

const fillFor = (i) => ["warm", "hot", "cool", "paper"][i % 4];

const renderTalkCard = (file, plateIdx) => {
  const slug = file.filename.replace(".md", "");
  const ytUrl = youtubeWatchUrl(file.video_embed);
  const primaryHref = ytUrl || `${slug}.html`;
  const fill = fillFor(plateIdx - 1);
  // The thumbnail layer: real marp PNG if present, gradient fill + flamingo
  // glyph as fallback (revealed by onerror swapping the img out).
  const thumb = `
    <a class="talk-thumb-link" href="${primaryHref}">
      <div class="talk-thumb fill-${fill}">
        <img class="thumb-img" src="${slug}.png" alt="" loading="lazy"
             onerror="this.classList.add('hidden');this.parentElement.classList.add('thumb-fallback');" />
        <span class="thumb-glyph" aria-hidden="true">🦩</span>
      </div>
    </a>`;
  return `
<article class="talk-card">
  ${thumb}
  <h3 class="talk-title"><a href="${primaryHref}">${file.title}</a></h3>
  ${file.description ? `<p class="talk-desc">${file.description}</p>` : ""}
  <div class="talk-formats">
    <a class="format-tag html" href="${slug}.html">HTML</a>
    <a class="format-tag pdf"  href="${slug}.pdf">PDF</a>
    <a class="format-tag pptx" href="${slug}.pptx">PPTX</a>
    <a class="format-tag txt"  href="${slug}.txt">TXT</a>
  </div>
</article>`;
};

const sectionHeader = ({ kicker, title, count, countLabel, anchor }) => `
<header class="section-header"${anchor ? ` id="${anchor}"` : ""}>
  <div class="rule strong"></div>
  <div class="sh-row">
    <span class="eyebrow">${kicker}</span>
    <h2 class="sh-title">${title}</h2>
    ${
      count != null
        ? `<span class="sh-count"><span class="num">${count}</span><span class="cap">${countLabel}</span></span>`
        : ""
    }
  </div>
</header>`;

const filedUnder = (label, items) => `
<div class="talks-strip">
  <span class="label">${label}</span>
  ${items.map((t) => `<span>${t}</span>`).join('<span class="sep">·</span>')}
</div>`;

const scheduleSubhead = (kicker, title, count) => `
<div class="schedule-sub">
  <span class="ss-eyebrow">${kicker}</span>
  <h3 class="ss-title">${title}</h3>
  <span class="ss-count">${count}</span>
</div>`;

const scheduleTable = (rows) => `
<table class="schedule">
  <thead><tr><th scope="col">Date</th><th scope="col">Talk</th><th scope="col">Where</th></tr></thead>
  <tbody>
    ${rows
      .map((r) => {
        const modeClass = r.mode || "v";
        const modeLabel =
          r.mode === "irl" ? "irl" : r.mode === "hybrid" ? "hybrid" : "virtual";
        const chip = r.mode
          ? `<span class="venue-mode ${modeClass}">${modeLabel}</span>`
          : "";
        return `<tr class="recent-row">
        <td class="sched-date">${r.date}</td>
        <td class="sched-talk">${r.talk}</td>
        <td class="sched-where">${chip}${r.where}</td>
      </tr>`;
      })
      .join("\n")}
  </tbody>
</table>`;

const masthead = (count) => `
<header class="masthead">
  <svg class="masthead-guilloche" aria-hidden="true" viewBox="0 0 1600 120" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="masthead-weave" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 0 24 Q 12 0 24 24 T 48 24" fill="none" stroke="currentColor" stroke-width="0.5"></path>
        <path d="M 0 24 Q 12 48 24 24 T 48 24" fill="none" stroke="currentColor" stroke-width="0.5"></path>
      </pattern>
    </defs>
    <g class="guilloche-drift">
      <rect x="-200" y="0" width="2000" height="120" fill="url(#masthead-weave)"></rect>
    </g>
  </svg>
  <div class="rule top draw-rule"></div>
  <div class="masthead-row">
    <a class="brand" href="https://cns.me">
      <span class="brand-cns">cns</span>
      <span class="brand-dot"></span>
      <span class="brand-me">me</span>
      <span class="brand-blog">/ talks</span>
      <svg class="brand-flourish" aria-hidden="true" viewBox="0 0 220 14" preserveAspectRatio="none">
        <path d="M 2 8 C 30 2, 70 12, 110 6 S 190 4, 218 8" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"></path>
      </svg>
    </a>
    <span class="masthead-meta"><em>A back catalogue</em></span>
  </div>
  <div class="rule draw-rule delay-1"></div>
  <nav class="masthead-nav">
    <div class="nav-left">
      <a href="#talks">Talks</a>
      <a href="#gov">Gov.uk</a>
      <a href="#schedule">Schedule</a>
    </div>
    <div class="nav-right">
      <a href="https://cns.me">LinkedIn</a>
      <a href="https://blog.cns.me">Blog</a>
      <a href="https://devpsyops.com">DevPsyOps</a>
      <a href="https://github.com/chrisns">GitHub</a>
    </div>
  </nav>
  <div class="rule draw-rule delay-2"></div>
</header>`;

const bookingStrip = () => `
<section class="booking-strip">
  <div class="booking-grid">
    <div>
      <span class="booking-eyebrow">Bookings</span>
      <h2 class="booking-title">Conferences, in-house <em>workshops,</em> podcasts &amp; the occasional debate.</h2>
    </div>
    <div class="booking-cta">
      <p>Currently only considering offers from organisations who agree that bureaucracy is an impediment to progress.</p>
      <a class="btn-on-pink" href="mailto:chris@cns.me">Drop a line →</a>
    </div>
  </div>
</section>`;

const colophon = () => `
<footer class="colophon">
  <div class="orn">🦩</div>
  <div class="colophon-grid">
    <div>
      <h4 class="cl-h">Elsewhere</h4>
      <ul class="cl-list">
        <li><a href="https://cns.me">LinkedIn / cns.me</a></li>
        <li><a href="https://blog.cns.me">Blog</a></li>
        <li><a href="https://devpsyops.com">DevPsyOps</a></li>
        <li><a href="https://github.com/chrisns">GitHub</a></li>
      </ul>
    </div>
    <div>
      <h4 class="cl-h">Bookings</h4>
      <p class="cl-p">Conferences, in-house workshops, podcasts and the occasional debate. Drop a line at <a href="mailto:chris@cns.me">chris@cns.me</a>.</p>
    </div>
  </div>
  <p class="cl-foot">© <span class="numeral">${new Date().getFullYear()}</span> Chris Nesbitt-Smith — all words my own.</p>
</footer>`;

const css = `
:root {
  --font-display: "Fraunces", "Times New Roman", ui-serif, serif;
  --font-body:    "Hanken Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --pink:        #E5197F;
  --pink-hot:    #FF2D8A;
  --pink-deep:   #B30E61;
  --pink-ink:    #5A0830;

  --ink:    #14110F;
  --ink-2:  #2A2622;
  --ink-3:  #5C544C;
  --ink-4:  #8A8077;
  --rule:   #1F1B17;

  --paper:   #F4EFE7;
  --paper-2: #EBE4D8;
  --paper-3: #DDD3C2;
  --bone:    #FBF8F2;

  --ease-out: cubic-bezier(0.2, 0.7, 0.2, 1);
  --maxw-page: 1320px;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
::selection { background: var(--pink); color: var(--bone); }
a { color: var(--pink-deep); text-decoration: underline; text-underline-offset: 3px; transition: color 220ms var(--ease-out); }
a:hover { color: var(--pink-hot); }

.page { max-width: var(--maxw-page); margin: 0 auto; padding: 32px 48px 0; }

.rule        { border-top: 1px solid var(--rule); }
.rule.strong { border-top: 2px solid var(--ink); }
.rule.top    { border-top: 4px solid var(--ink); }

.numeral { font-family: var(--font-mono); font-feature-settings: "tnum" 1; letter-spacing: 0.02em; }

/* ============================================================
   Masthead
============================================================ */
.masthead { padding-top: 8px; position: relative; isolation: isolate; }

.masthead-guilloche {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 0;
  color: var(--pink); opacity: 0.10;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
}
.guilloche-drift { transform-origin: center; animation: guilloche-drift 38s linear infinite; will-change: transform; }
@keyframes guilloche-drift { from { transform: translateX(0);} to { transform: translateX(-48px);} }

.masthead-row, .masthead-nav, .masthead .rule { position: relative; z-index: 1; }

.masthead-row {
  display: grid; grid-template-columns: 1fr auto;
  align-items: baseline; gap: 32px; padding: 14px 0;
}
.brand { position: relative; display: inline-flex; align-items: baseline; gap: 6px; text-decoration: none; color: var(--ink); }
.brand-cns, .brand-me {
  font-family: var(--font-display); font-weight: 900; font-size: 28px;
  letter-spacing: -0.03em; line-height: 1;
}
.brand-me { font-style: italic; }
.brand-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--pink); transform: translateY(-2px); }
.brand-blog { font-family: var(--font-mono); font-size: 14px; font-weight: 400; letter-spacing: 0.04em; color: var(--ink-3); margin-left: 6px; align-self: baseline; }
.brand-flourish { position: absolute; left: 0; bottom: -10px; width: 100%; height: 12px; color: var(--pink); opacity: 0.55; pointer-events: none; overflow: visible; }
.brand-flourish path { stroke-dasharray: 360; stroke-dashoffset: 360; animation: flourish-draw 1.6s cubic-bezier(0.4,0,0.2,1) 0.4s forwards; }
.brand:hover .brand-flourish path { animation: flourish-draw 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }
@keyframes flourish-draw { from { stroke-dashoffset: 360;} to { stroke-dashoffset: 0;} }

.masthead-meta { font-family: var(--font-body); font-size: 13px; color: var(--ink-2); }
.masthead-meta em { font-family: var(--font-display); font-style: italic; font-weight: 500; color: var(--ink); }

.draw-rule { position: relative; overflow: hidden; }
.draw-rule::after {
  content: ""; position: absolute; inset: 0;
  background: var(--paper);
  transform-origin: right center;
  animation: rule-draw 0.9s cubic-bezier(0.7,0,0.2,1) forwards;
}
.draw-rule.delay-1::after { animation-delay: 0.2s; }
.draw-rule.delay-2::after { animation-delay: 0.4s; }
@keyframes rule-draw { from { transform: scaleX(1);} to { transform: scaleX(0);} }

.masthead-nav { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; font-family: var(--font-body); }
.nav-left, .nav-right { display: flex; gap: 22px; flex-wrap: wrap; }
.masthead-nav a {
  text-decoration: none; color: var(--ink); font-size: 14px;
  display: inline-flex; align-items: baseline; gap: 6px;
  border-bottom: 1px dotted transparent; padding-bottom: 2px;
  transition: color 200ms;
}
.masthead-nav a:hover { color: var(--pink); }
.nav-right a { color: var(--ink-2); font-size: 13px; }

@media (prefers-reduced-motion: reduce) {
  .guilloche-drift, .brand-flourish path, .draw-rule::after { animation: none !important; }
  .brand-flourish path { stroke-dashoffset: 0; }
  .draw-rule::after { display: none; }
}

/* ============================================================
   Hero — Plate I
============================================================ */
.talks-hero {
  display: grid; grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  gap: 64px; align-items: start;
  padding: 56px 0 80px;
  border-top: 1px solid var(--rule);
}
.talks-hero .plate { margin: 0; }
.plate-frame {
  position: relative;
  border: 1px solid var(--ink);
  padding: 14px;
  background: var(--paper);
}
.plate-frame img {
  display: block;
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
  object-position: center 18%;
  filter: contrast(1.03) saturate(1.02);
}
.plate-stamp {
  position: absolute;
  top: -14px; right: -14px;
  background: var(--pink);
  color: var(--bone);
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 6px 10px 5px;
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 12px 32px -12px rgba(229,25,127,0.45);
  z-index: 2;
}
.plate-stamp::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: var(--bone); display: inline-block;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot { 0%,100% { opacity: 1;} 50% { opacity: 0.4;} }

.plate figcaption {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 12px;
  font-family: var(--font-mono);
  font-size: 10.5px; letter-spacing: 0.10em; color: var(--ink-3);
}
.plate figcaption .caption em {
  color: var(--ink); font-style: italic;
  font-family: var(--font-display); font-weight: 500; letter-spacing: 0;
}

.talks-hero-body { display: flex; flex-direction: column; gap: 28px; }
.eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--pink-deep);
  display: block;
}
.talks-hero-headline {
  font-family: var(--font-display); font-weight: 900;
  font-size: clamp(48px, 6.4vw, 92px); line-height: 0.96;
  letter-spacing: -0.03em; color: var(--ink);
  font-variation-settings: "opsz" 144;
  margin: 0; text-wrap: balance;
}
.talks-hero-headline em { color: var(--pink); font-style: italic; font-weight: 700; }
.talks-hero-lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: clamp(18px, 1.6vw, 22px); line-height: 1.55;
  color: var(--ink-2); max-width: 56ch; margin: 0; text-wrap: pretty;
}
.talks-hero-lede em { color: var(--pink-deep); }

.talks-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 4px; }

.talks-hero-meta {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px; margin-top: 8px; padding-top: 24px;
  border-top: 1px solid var(--rule);
}
.talks-hero-meta .stat-num {
  font-family: var(--font-display); font-weight: 700;
  font-size: 36px; line-height: 1; color: var(--pink);
  letter-spacing: -0.02em; display: block;
}
.talks-hero-meta .stat-cap {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3); display: block; margin-top: 4px;
}

/* ============================================================
   Buttons
============================================================ */
.btn {
  font-family: var(--font-body); font-weight: 600; font-size: 14px;
  padding: 13px 26px; border: 0; cursor: pointer;
  text-decoration: none; display: inline-flex; align-items: center;
  transition: all 200ms cubic-bezier(0.2,0.7,0.2,1);
}
.btn-primary { background: var(--pink); color: var(--bone); border-radius: 999px; }
.btn-primary:hover { background: var(--pink-hot); box-shadow: 0 12px 32px -12px rgba(229,25,127,0.65); transform: translateY(-1px); }
.btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--ink); border-radius: 0; }
.btn-ghost:hover { background: var(--ink); color: var(--paper); }
.btn-on-pink {
  background: var(--ink); color: var(--paper); border-radius: 999px;
  padding: 13px 26px; font-family: var(--font-body); font-weight: 600;
  font-size: 14px; text-decoration: none; display: inline-flex; align-items: center;
  transition: all 200ms cubic-bezier(0.2,0.7,0.2,1);
}
.btn-on-pink:hover { background: var(--bone); color: var(--ink); transform: translateY(-1px); }

/* ============================================================
   Section header
============================================================ */
.section-header { margin-top: 48px; }
.sh-row {
  display: grid; grid-template-columns: auto 1fr auto; gap: 32px;
  align-items: end; padding: 24px 0;
}
.sh-row .eyebrow { margin: 0; min-width: 220px; color: var(--pink-deep); }
.sh-title {
  font-family: var(--font-display); font-weight: 700;
  font-size: clamp(36px, 4vw, 56px); line-height: 1; letter-spacing: -0.02em;
  margin: 0; color: var(--ink); text-align: right; text-wrap: balance;
}
.sh-title em { color: var(--pink); font-style: italic; }
.sh-count { display: inline-flex; flex-direction: column; align-items: end; }
.sh-count .num { font-family: var(--font-display); font-weight: 700; font-size: 28px; color: var(--pink); line-height: 1; }
.sh-count .cap { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-3); }

/* ============================================================
   Topic strip
============================================================ */
.talks-strip {
  display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap;
  font-family: var(--font-mono);
  font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-3);
  border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  padding: 12px 0; margin: 0 0 8px;
}
.talks-strip .label { color: var(--pink-deep); font-weight: 600; }
.talks-strip .sep { color: var(--paper-3); }

/* ============================================================
   Talk grid + card
============================================================ */
.talk-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 36px 32px; padding: 24px 0 12px;
}
.talk-card {
  border-top: 1px solid var(--rule); padding-top: 14px;
  display: flex; flex-direction: column; gap: 10px;
  min-height: 280px;
}
.talk-thumb-link { display: block; text-decoration: none; }
.talk-thumb-link:hover .talk-thumb { transform: translateY(-2px); }
.talk-thumb {
  position: relative; aspect-ratio: 16/10;
  border: 1px solid var(--ink); overflow: hidden;
  margin: 4px 0 6px;
  transition: transform 200ms var(--ease-out);
}
.talk-thumb .thumb-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: contain; background: var(--paper-2); z-index: 0;
}
.talk-thumb .thumb-img.hidden { display: none; }
.talk-thumb .thumb-glyph {
  position: absolute; inset: 0;
  display: none; align-items: center; justify-content: center;
  font-family: var(--font-display); font-style: italic;
  font-size: 38px; color: rgba(251,248,242,0.4);
  z-index: 1;
}
.talk-thumb.thumb-fallback .thumb-glyph { display: flex; }
.talk-thumb.fill-paper { background: var(--paper-2); }
.talk-thumb.fill-paper.thumb-fallback .thumb-glyph { color: var(--ink-4); }
.talk-thumb.fill-paper::before {
  content: ""; position: absolute; inset: 14px;
  border: 1px dashed var(--paper-3); z-index: 1;
}
.talk-thumb.fill-paper.thumb-fallback::after {
  content: ""; position: absolute; inset: 28px;
  border-top: 1px solid var(--paper-3); transform: rotate(45deg); z-index: 1;
}
.talk-thumb.fill-warm.thumb-fallback {
  background:
    radial-gradient(circle at 30% 40%, rgba(229,25,127,0.32), transparent 55%),
    linear-gradient(135deg, #2A2622 0%, #14110F 80%);
}
.talk-thumb.fill-hot.thumb-fallback {
  background:
    radial-gradient(circle at 70% 30%, rgba(229,25,127,0.50), transparent 55%),
    linear-gradient(135deg, #3A332D 0%, #14110F 70%);
}
.talk-thumb.fill-cool.thumb-fallback {
  background:
    radial-gradient(circle at 30% 70%, rgba(229,25,127,0.18), transparent 55%),
    linear-gradient(160deg, #221E1A 0%, #14110F 80%);
}

.talk-title {
  font-family: var(--font-display); font-weight: 700;
  font-size: 22px; line-height: 1.18; letter-spacing: -0.015em;
  margin: 0; color: var(--ink); text-wrap: balance;
}
.talk-title em { color: var(--pink); font-style: italic; }
.talk-title a { color: var(--ink); text-decoration: none; transition: color 200ms; }
.talk-title a:hover { color: var(--pink); }
.talk-title a:hover em { color: var(--pink-hot); }

.talk-desc {
  font-family: var(--font-body); font-size: 14px; line-height: 1.55;
  color: var(--ink-2); margin: 0; flex: 1;
}

.talk-formats { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 12px; margin-top: auto; }
.format-tag {
  font-family: var(--font-mono); font-size: 10px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink); border: 1px solid var(--ink); padding: 4px 8px 3px;
  text-decoration: none; transition: background 150ms, color 150ms, border-color 150ms;
}
.format-tag:hover { background: var(--ink); color: var(--paper); }
.format-tag.html { color: var(--pink-deep); border-color: var(--pink-deep); }
.format-tag.html:hover { background: var(--pink); color: var(--bone); border-color: var(--pink); }

/* Section break */
.section-break {
  text-align: center; padding: 56px 0 32px;
  font-family: var(--font-display); font-size: 28px; color: var(--pink);
  letter-spacing: 0.4em;
}

/* ============================================================
   Schedule
============================================================ */
.schedule-wrap { padding: 8px 0 16px; }
.schedule-sub {
  display: grid; grid-template-columns: 220px 1fr auto;
  align-items: baseline; gap: 24px;
  padding: 16px 0 14px; border-bottom: 2px solid var(--ink);
  margin-top: 36px;
}
.schedule-sub .ss-eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--pink-deep);
}
.schedule-sub .ss-title {
  font-family: var(--font-display); font-style: italic; font-weight: 500;
  font-size: 22px; line-height: 1.2; color: var(--ink); margin: 0;
}
.schedule-sub .ss-count {
  font-family: var(--font-mono); font-size: 10.5px;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-3);
}

.schedule-empty {
  font-family: var(--font-display); font-style: italic;
  font-size: 19px; line-height: 1.5; color: var(--ink-2);
  padding: 24px 0 32px; border-bottom: 1px solid var(--rule);
  text-wrap: pretty;
}
.schedule-empty a { color: var(--pink-deep); text-decoration: underline; text-underline-offset: 3px; }
.schedule-empty a:hover { color: var(--pink-hot); }

.schedule { width: 100%; border-collapse: collapse; margin: 4px 0 0; }
.schedule th {
  text-align: left; font-family: var(--font-mono); font-weight: 500;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3); padding: 12px 16px 10px 0;
  border-bottom: 1px solid var(--rule);
}
.schedule td {
  padding: 14px 16px 14px 0; font-size: 14px; color: var(--ink);
  border-bottom: 1px solid var(--paper-3); vertical-align: baseline;
}
.schedule tr.recent-row { transition: background 150ms; }
.schedule tr.recent-row:hover { background: rgba(229,25,127,0.04); }
.schedule td.sched-date { font-family: var(--font-mono); color: var(--ink-3); white-space: nowrap; width: 120px; letter-spacing: 0.04em; }
.schedule td.sched-talk { font-family: var(--font-display); font-weight: 600; font-style: italic; font-size: 15px; color: var(--ink); letter-spacing: -0.005em; }
.schedule td.sched-where { color: var(--ink-2); font-size: 13.5px; }
.schedule td.sched-where a { color: var(--pink-deep); text-decoration: underline; text-underline-offset: 3px; }
.schedule td.sched-where a:hover { color: var(--pink-hot); }
.schedule td.sched-where .venue-mode {
  font-family: var(--font-mono); font-size: 10px; font-weight: 500;
  letter-spacing: 0.10em; text-transform: uppercase;
  color: var(--pink-deep); border: 1px solid var(--paper-3);
  padding: 2px 6px 1px; margin-right: 10px; display: inline-block;
}
.schedule td.sched-where .venue-mode.irl    { color: var(--pink-deep); border-color: var(--pink-deep); }
.schedule td.sched-where .venue-mode.v      { color: var(--ink-3); }
.schedule td.sched-where .venue-mode.hybrid { color: var(--pink); border-color: var(--pink); }

.schedule-more {
  text-align: center; padding: 24px 0 64px;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-3);
}
.schedule-more::before, .schedule-more::after { content: "·"; margin: 0 14px; color: var(--paper-3); }

/* ============================================================
   Booking strip
============================================================ */
.booking-strip {
  background: var(--pink); color: var(--bone);
  margin: 56px -48px 0; padding: 80px 48px;
  position: relative; overflow: hidden;
}
.booking-strip::before {
  content: ""; position: absolute; inset: 24px;
  border: 1px solid rgba(251,248,242,0.18); pointer-events: none;
}
.booking-grid {
  max-width: 1180px; margin: 0 auto;
  display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 64px; align-items: end; position: relative; z-index: 1;
}
.booking-eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--bone); display: block; margin-bottom: 18px; opacity: 0.85;
}
.booking-title {
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(36px, 4.4vw, 64px); line-height: 1; letter-spacing: -0.025em;
  color: var(--bone); margin: 0; text-wrap: balance;
}
.booking-title em { font-style: italic; color: var(--ink); }
.booking-cta p {
  font-family: var(--font-display); font-style: italic;
  font-size: 18px; line-height: 1.5; color: var(--bone);
  margin: 0 0 18px; text-wrap: pretty;
}

/* ============================================================
   Colophon
============================================================ */
.colophon {
  padding: 72px 0 48px; border-top: 4px solid var(--ink); margin-top: 32px;
}
.colophon .orn { text-align: center; font-family: var(--font-display); font-size: 32px; color: var(--pink); margin-bottom: 32px; }
.colophon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.cl-foot {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  margin: 40px 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--rule);
}
.cl-h { font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--pink-deep); margin: 0 0 12px; }
.cl-p { font-family: var(--font-body); font-size: 14px; line-height: 1.55; color: var(--ink-2); margin: 0 0 8px; }
.cl-p em { font-family: var(--font-display); font-style: italic; color: var(--ink); }
.cl-p.meta { font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); }
.cl-p a { color: var(--pink-deep); text-decoration: underline; text-underline-offset: 3px; }
.cl-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.cl-list a { font-family: var(--font-body); font-size: 14px; color: var(--ink); text-decoration: none; border-bottom: 1px dotted var(--ink-3); padding-bottom: 1px; }
.cl-list a:hover { color: var(--pink); border-color: var(--pink); }

/* ============================================================
   Responsive
============================================================ */
@media (max-width: 900px) {
  .page { padding: 24px; }
  .talks-hero { grid-template-columns: 1fr; gap: 32px; padding: 36px 0 56px; }
  .talks-hero .plate { max-width: 320px; }
  .talks-hero-meta { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .sh-row { grid-template-columns: 1fr; gap: 12px; }
  .sh-title { text-align: left; }
  .sh-row .eyebrow { min-width: 0; }
  .schedule-sub { grid-template-columns: 1fr; gap: 6px; }
  .booking-strip { margin: 40px -24px 0; padding: 56px 24px; }
  .booking-grid { grid-template-columns: 1fr; gap: 28px; }
  .schedule td.sched-date { width: 90px; }
  .schedule th:nth-child(3), .schedule td:nth-child(3) { display: none; }
  .colophon-grid { grid-template-columns: 1fr; gap: 32px; }
  .masthead-row { grid-template-columns: 1fr; gap: 8px; }
  .masthead-nav { flex-direction: column; align-items: flex-start; gap: 8px; }
  .nav-left, .nav-right { gap: 14px; }
}
@media (max-width: 520px) {
  .brand-cns, .brand-me { font-size: 24px; }
  .talks-hero-headline { font-size: 44px; }
  .sh-title { font-size: clamp(28px, 8vw, 36px); }
}
`;

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Chris Nesbitt-Smith — talks about software development</title>
<meta name="title" content="Chris Nesbitt-Smith talks about software development" />
<meta name="description" content="A back catalogue of conference talks, workshops and webinars by Chris Nesbitt-Smith — Kubernetes, platform engineering, policy as code, and digital government." />
<meta name="theme-color" content="#F4EFE7" />

<meta property="og:type" content="website" />
<meta property="og:url" content="https://talks.cns.me/" />
<meta property="og:title" content="Chris Nesbitt-Smith — talks" />
<meta property="og:description" content="A back catalogue of conference talks, workshops and webinars by Chris Nesbitt-Smith." />
<meta property="og:image" content="https://talks.cns.me/images/me.png" />

<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://talks.cns.me/" />
<meta property="twitter:title" content="Chris Nesbitt-Smith — talks" />
<meta property="twitter:description" content="A back catalogue of conference talks, workshops and webinars by Chris Nesbitt-Smith." />
<meta property="twitter:image" content="https://talks.cns.me/images/me.png" />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Hanken+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<style>${css}</style>

<script async src="https://www.googletagmanager.com/gtag/js?id=G-BF3VN6JZZG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BF3VN6JZZG');
</script>
</head>`;

const totalCount = files.length;

const otherCardsHtml = otherTalks
  .map((f, i) => renderTalkCard(f, i + 1))
  .join("\n");
const govCardsHtml = govUkTalks
  .map((f, i) => renderTalkCard(f, otherTalks.length + i + 1))
  .join("\n");

const upcomingPane = futureRows.length
  ? scheduleTable(futureRows)
  : `<p class="schedule-empty">Nothing on the books just now. <a href="mailto:chris@cns.me">Get in touch</a> if you'd like to invite me to speak — workshops, conferences, podcasts, or in-house briefings.</p>`;

const body = `
<body>
<div class="page">
${masthead(totalCount)}

<main>
<section class="talks-hero">
  <figure class="plate">
    <div class="plate-frame">
      <span class="plate-stamp">Available for talks</span>
      <img src="images/me.png" alt="Chris Nesbitt-Smith" />
    </div>
    <figcaption>
      <span class="caption">Plate I — <em>The author,</em> on stage.</span>
      <span class="avail">talks.cns.me</span>
    </figcaption>
  </figure>

  <div class="talks-hero-body">
    <h1 class="talks-hero-headline">Talks on <em>Kubernetes,</em> platforms &amp; digital government.</h1>
    <p class="talks-hero-lede">A working back catalogue of conference talks, workshops and webinars — covering platform engineering, <em>policy as [versioned] code,</em> multi&#8209;tenancy, and the realities of building digital services for the public.</p>
    <div class="talks-hero-ctas">
      <a class="btn btn-primary" href="#talks">Browse the catalogue →</a>
      <a class="btn btn-ghost" href="#schedule">See schedule</a>
    </div>
    <div class="talks-hero-meta">
      <div><span class="stat-num">${totalCount}</span><span class="stat-cap">Talks indexed</span></div>
      <div><span class="stat-num">${pastRows.length}</span><span class="stat-cap">Sessions delivered</span></div>
      <div><span class="stat-num">2021</span><span class="stat-cap">Catalogue est.</span></div>
    </div>
  </div>
</section>

${sectionHeader({
  kicker: "Selected talks",
  title: "A working <em>catalogue.</em>",
  count: otherTalks.length,
  countLabel: "entries · curated",
  anchor: "talks",
})}

${filedUnder("Filed under", [
  "Kubernetes",
  "Policy as code",
  "Platform engineering",
  "Multi-tenancy",
  "Cloud security",
])}

<div class="talk-grid">
  ${otherCardsHtml}
</div>

${
  govUkTalks.length
    ? `
<div class="section-break">🦩</div>

${sectionHeader({
  kicker: "UK gov.",
  title: "<em>DSIT</em> · GDS · CDDO",
  count: govUkTalks.length,
  countLabel: "briefings · public sector",
  anchor: "gov",
})}

${filedUnder("Audiences", [
  "Permanent secretaries",
  "Tech leadership",
  "Cross-government",
])}

<div class="talk-grid">
  ${govCardsHtml}
</div>`
    : ""
}

${bookingStrip()}

${sectionHeader({
  kicker: "Schedule",
  title: "Where <em>next,</em> where recently.",
  count: "UTC",
  countLabel: "listed reverse-chron",
  anchor: "schedule",
})}

<div class="schedule-wrap">
  ${scheduleSubhead("Upcoming", "On the books", `${futureRows.length} confirmed`)}
  ${upcomingPane}

  ${scheduleSubhead("Recent", "Archived appearances", `${pastRows.length} archived · newest first`)}
  ${scheduleTable(pastRows)}
  <div class="schedule-more">End of catalogue</div>
</div>

${bookingStrip()}

${colophon()}
</main>
</div>
</body>
</html>`;

process.stdout.write(head + body);
