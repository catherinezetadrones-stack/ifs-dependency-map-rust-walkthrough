// Builds index.html from walkthrough.src.html by copying each code excerpt straight out of
// the ifs-depmap checkout this folder sits in, so the page always shows the real lines.
//
//   node learn/build.mjs           (from ifs-depmap)
//   node learn/build.mjs --dirty   build even if an excerpted file has uncommitted changes
//
// In the template:
//   <pre class="code" data-src="crates/ifsdep-core/src/scan.rs:15-66" data-mark="21:1,29:2"></pre>
// fills the block with lines 15-66 of that file; data-mark tags lines with callout numbers.
// Text inside <code>…</code> in the prose is HTML-escaped, so generics can be written as-is.
//
// Each block links to the same lines on GitHub at the checked-out commit, so the commit must
// be pushed and the excerpted files unchanged since it, or the GitHub line numbers won't match.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GITHUB = "https://github.com/phbronson999/ifs-dependency-map";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();

const sha = git("rev-parse", "HEAD");
const prefix = git("rev-parse", "--show-prefix"); // "ifs-depmap/": the project sits in a subfolder of the repo

let html = readFileSync(join(here, "walkthrough.src.html"), "utf8");
const problems = [];
const files = new Set();
const cache = new Map();
const lines = (rel) => {
  if (!cache.has(rel)) cache.set(rel, readFileSync(join(repo, rel), "utf8").replace(/\r\n/g, "\n").split("\n"));
  return cache.get(rel);
};

// Prose may also already be written with entities (&amp;, &lt;); don't escape those twice.
const escProse = (s) => s.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
html = html.replace(/<code>([\s\S]*?)<\/code>/g, (_, inner) => `<code>${escProse(inner)}</code>`);
html = html.replace("<!--COMMIT-->", `<a href="${GITHUB}/tree/${sha}/${prefix}">${sha.slice(0, 7)}</a>`);

let blocks = 0;
html = html.replace(/<pre class="code" data-src="([^"]+)"([^>]*)><\/pre>/g, (_, src, rest) => {
  const [, file, a, b] = src.match(/^(.+):(\d+)-(\d+)$/) ?? [];
  if (!file) {
    problems.push(`bad data-src ${src}`);
    return "";
  }
  files.add(file);
  const all = lines(file);
  const [start, end] = [Number(a), Number(b)];
  if (end > all.length) problems.push(`${src}: file has ${all.length} lines`);
  const mark = rest.match(/data-mark="([^"]*)"/)?.[1] ?? "";
  for (const m of mark.split(",").filter(Boolean)) {
    const ln = Number(m.split(":")[0]);
    if (ln < start || ln > end) problems.push(`${src}: mark ${m} is outside the excerpt`);
  }
  blocks++;
  const body = all.slice(start - 1, end).join("\n");
  const gh = `${GITHUB}/blob/${sha}/${prefix}${file}#L${start}-L${end}`;
  return `<pre class="code" data-file="${file}" data-start="${start}" data-gh="${gh}"${rest}>${esc(body)}</pre>`;
});

const dirty = git("status", "--porcelain", "--", ...files);
if (dirty && !process.argv.includes("--dirty")) {
  problems.push(`excerpted files differ from commit ${sha.slice(0, 7)}, so the GitHub links would show other lines:\n${dirty}\ncommit them first, or pass --dirty`);
}
if (!git("branch", "-r", "--contains", sha)) {
  console.warn(`warning: commit ${sha.slice(0, 7)} isn't on any remote branch yet, so the GitHub links won't open until it's pushed`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
writeFileSync(join(here, "index.html"), html);
console.log(`wrote learn/index.html (${blocks} excerpts, commit ${sha.slice(0, 7)})`);
