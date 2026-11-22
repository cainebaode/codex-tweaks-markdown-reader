import { build } from "esbuild";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
const common = { bundle: true, format: "esm", minify: true, metafile: true };
const viewer = await build({
  ...common,
  entryPoints: ["viewer.js"],
  platform: "browser",
  target: "chrome120",
  write: false,
});
const template = await readFile("viewer.html", "utf8");
const script = viewer.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
await writeFile("dist/viewer.html", template.replace("/* SCRIPT */", () => script));

const server = await build({
  ...common,
  entryPoints: ["server.mjs"],
  outfile: "dist/server.mjs",
  platform: "node",
  target: "node22",
});

const packages = new Set();
for (const file of [...Object.keys(viewer.metafile.inputs), ...Object.keys(server.metafile.inputs)]) {
  const root = file.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//)?.[1];
  if (root) packages.add(root);
}
const notices = [];
for (const root of [...packages].sort()) {
  const { name, version, license } = JSON.parse(await readFile(`${root}/package.json`, "utf8"));
  const files = (await readdir(root)).filter((file) => /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/i.test(file));
  const contents = await Promise.all(files.sort().map((file) => readFile(`${root}/${file}`, "utf8")));
  if (!contents.length) throw new Error(`License file not found in ${name}`);
  notices.push(`# ${name}@${version} (${license ?? "see below"})\n\n${contents.join("\n\n").replace(/[ \t]+$/gm, "").trim()}`);
}
await writeFile("dist/THIRD-PARTY-NOTICES.txt", notices.join("\n\n") + "\n");
