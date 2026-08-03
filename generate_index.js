import fs from "fs";
import { createRequire } from "module";

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

// The design system is the dependency @chrisns/design, not a copy in this file.
// tokens.css only — talks has never had the semantic type layer that
// colors_and_type.css adds, and pulling that in restyles code, .label and
// .numeral. The <head> below already links the exact Google Fonts URL that
// tokens.css @imports, and a <link> starts the fetch earlier than an @import
// nested in inline CSS, so the @import is stripped rather than duplicated.
const require_ = createRequire(import.meta.url);
const design = (spec) =>
  fs.readFileSync(require_.resolve(`@chrisns/design/${spec}`), "utf8");
const tokens = design("tokens.css");
// Derive the font URL from tokens.css rather than hardcoding it, so the <link>
// can never drift from what the design system actually asks for.
const fontUrl = tokens.match(
  /@import url\("(https:\/\/fonts\.googleapis\.com[^"]+)"\)/,
)[1];
const css = [tokens, design("talks")]
  .join("\n")
  .replace(/@import url\("https:\/\/fonts\.googleapis\.com[^"]*"\);?/g, "");

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
<link href="${fontUrl}" rel="stylesheet">

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
