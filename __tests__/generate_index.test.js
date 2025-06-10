import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const script = fileURLToPath(new URL("../generate_index.js", import.meta.url));

test("index generation includes headings", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "talks-test-"));
  fs.writeFileSync(
    path.join(tmp, "schedule.md"),
    `| Date | Talk | Where |
| --- | --- | --- |
| 2099-01-01 | The Future | (v)[Future](https://example.com) |
| 2000-01-01 | The Past | (v)[Past](https://example.com) |
`,
  );
  fs.writeFileSync(
    path.join(tmp, "demo.md"),
    "title: Demo Talk\ndescription: Something\n",
  );
  const output = execFileSync("node", [script], {
    cwd: tmp,
  });
  const html = output.toString();
  expect(html).toContain("Upcoming talks");
  expect(html).toContain("Previous talks");
  expect(html).not.toContain("[object Object]");
  expect(html).not.toContain("undefined</table>");
});
