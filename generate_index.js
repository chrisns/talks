import fs from "fs";

const exclude = ["CODE_OF_CONDUCT.md", "SECURITY.md"];

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

output.push("<html>");
output.push("<head>");
output.push(`
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>`);
output.push(`<style>
  iframe {
    width: 100%;
    border-top-right-radius: 1.5rem;
    border-top-left-radius: 1.5rem;

  }
  div.card {
    float: left;
    width: 32rem;
    min-height: 32rem;
    border: 1px solid grey;
    border-radius: 1.5rem;
    margin: 0.5rem;
  }
</style>`);
output.push("</head>");
output.push("<body>");
output.push(`<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
<a class="navbar-brand" href="https://cns.me">Chris Nesbitt-Smith</a> | 
<div class="collapse navbar-collapse" id="navbarNavAltMarkup">
  <div class="navbar-nav">
    <a class="nav-item nav-link active" >Talks <span class="sr-only">(current)</span></a>
    <a class="nav-item nav-link" href="https://cns.me">LinkedIn</a>
    <a class="nav-item nav-link" href="https://github.com/chrisns">Github</a>
  </div>
</div>
</nav>`);

files.forEach((file) =>
  output.push(`
  <div class="card">
  ${file.video_embed}
<div class="card-body text-center">
  <h5 class="card-title">${file.title}</h5>
  <p class="card-text">${file.description}</p>
  <a href="${file.filename.replace(".md", ".html")}" title="${
    file.title
  }" class="btn btn-primary">
  Presentation Deck</a></div>
</div>
`)
);
output.push("</body></html>");
process.stdout.write(output.join("\n"));
