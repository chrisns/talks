import fs from "fs";
import { marked } from "marked";

const exclude = [
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "README.md",
  "schedule.md",
];

const output = [];

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
    };
  });
let scheduleSelect = "future";
const schedule = fs.readFileSync("schedule.md", "utf8");

const renderer = {
  table(header, body) {
    return `<table class="table table-striped table-sm">
<thead class="thead-dark">${header}</thead>
${body}
</table>`;
  },
  tablerow(content) {
    const date = (content.match(/\d{4}-\d{2}-\d{2}/g) || [])[0];
    if (
      date === undefined ||
      (scheduleSelect === "future" && date && Date.parse(date) > Date.now()) ||
      (scheduleSelect === "past" && date && Date.parse(date) < Date.now())
    )
      return `<tr>\n${content}</tr>\n`;
    return "";
  },
};
marked.use({ renderer });

const scheduleFuture = marked.parse(schedule);

scheduleSelect = "past";
const schedulePast = marked.parse(schedule);

output.push("<html>");
output.push("<head>");
output.push(`
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>`);
output.push(`<style>
.card img,
iframe {
  width: 100%;
  border-top-right-radius: 1.5rem;
  border-top-left-radius: 1.5rem;
}
iframe {
  height: auto;
}
body {
  background: url("images/me.png") no-repeat;
  background-size: cover;
}
div.schedule table td:nth-child(1){
  white-space: nowrap;
}
.schedule h2 {
  text-align: center;
}
div.card {
  background: rgba(255,255,255,.75);
  float: left;
  border: 1px solid grey;
  border-radius: 1.5rem;
  margin: 0.5rem;
}
@media (min-width: 1024px) {
  div.card {
    width: 21rem;
    min-height: 22rem;
    
  }
  div.col-md-auto.schedule,
  div.card.schedule {
    min-width: 32rem;
  }
}
</style>`);
output.push(
  `<title>Chris Nesbitt-Smith talks about software development</title>`,
);
output.push("</head>");
output.push("<body>");
output.push(`<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <a class="navbar-brand" href="https://cns.me">Chris Nesbitt-Smith</a> |
  <div class="navbar" id="navbarNavAltMarkup">
  <div class="navbar-nav">
  <a class="nav-item nav-link active" >Talks <span class="sr-only">(current)</span></a>
  <a class="nav-item nav-link" href="https://cns.me">LinkedIn</a>
  <a class="nav-item nav-link" href="https://devpsyops.com">DevPsyOps</a>
  <a class="nav-item nav-link" href="https://github.com/chrisns">Github</a>
  </div>
  </div>
  </nav>`);

output.push(`<div class="container-fluid">`);
output.push(`<div class="row">`);
output.push(`<div class="col-md-auto schedule">`);
output.push(`<div class="row">`);
if (scheduleFuture.includes("<td>"))
  output.push(
    `<div class="card schedule future"><h2>Upcoming talks</h2>${scheduleFuture}</div>`,
  );
output.push(`</div>`);
output.push(`<div class="row">`);
output.push(
  `<div class="card schedule past"><h2>Previous talks</h2>${schedulePast}</div>`,
);
output.push(`</div>`);
output.push(`</div>`);
output.push(`<div class="col">`);

files.forEach((file) =>
  output.push(`
<div class="card">
${
  file.video_embed ||
  `<img src="${file.filename.replace(
    ".md",
    ".png",
  )}" class="card-img-top" alt="${file.title}">`
}
  <div class="card-body text-center">
  <h5 class="card-title">${file.title}</h5>
  <p class="card-text">${file.description}</p>
  <a href="${file.filename.replace(".md", ".html")}" title="${
    file.title
  } HTML presentation deck" class="btn btn-primary">
  HTML</a>
  <a href="${file.filename.replace(".md", ".pdf")}" title="${
    file.title
  } PDF presentation deck" class="btn btn-primary">
  PDF</a>
  <a href="${file.filename.replace(".md", ".pptx")}" title="${
    file.title
  } PPTX presentation deck" class="btn btn-primary">
  PPTX</a>
  <a href="${file.filename.replace(".md", ".txt")}" title="${
    file.title
  } TXT presentation notes" class="btn btn-primary">
  TXT</a>
  </div>
  </div>
  `),
);
output.push(`</div>`);
output.push(`</div>`);
output.push(`</div>`);
output.push("</body></html>");
process.stdout.write(output.join("\n"));
