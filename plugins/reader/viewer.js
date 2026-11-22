import { App } from "@modelcontextprotocol/ext-apps";
import { OpenAIExtensions } from "@openai/mcp-extensions/app";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import GithubSlugger from "github-slugger";

const app = new App({ name: "Markdown 阅读器", version: "0.1.0" });
const extensions = new OpenAIExtensions(app);
const article = document.querySelector("article");
const status = document.querySelector("#status");
const markdown = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return `<span class="image-caption">${escapeHtml(text || "图片")}</span>`;
    },
  },
});

let opened;

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function render(text) {
  const fragment = DOMPurify.sanitize(markdown.parse(text), {
    USE_PROFILES: { html: true },
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ["img"],
    FORBID_ATTR: ["style"],
  });
  const slugger = new GithubSlugger();
  for (const heading of fragment.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    heading.id = slugger.slug(heading.textContent);
  }
  for (const table of fragment.querySelectorAll("table")) {
    const container = document.createElement("div");
    container.className = "table-scroll";
    table.before(container);
    container.append(table);
  }
  for (const link of fragment.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    if (!href.startsWith("#") && !/^https?:\/\//i.test(href)) {
      link.removeAttribute("href");
    }
  }
  article.replaceChildren(fragment);
}

function setStatus(text) {
  status.textContent = text;
  status.hidden = !text;
}

async function refresh(file) {
  const sequence = ++file.sequence;
  try {
    const result = await extensions.resources.read({ uri: file.uri, representation: "text" });
    if (file !== opened || sequence !== file.sequence) return;
    const content = result.contents.find((item) => item.uri === file.uri);
    if (typeof content?.text !== "string") throw new Error("客户端未返回 Markdown 文本");
    if (file.text !== content.text) {
      render(content.text);
      file.text = content.text;
    }
    setStatus(content.text.trim() ? "" : "此文件为空。");
  } catch {
    if (file === opened && sequence === file.sequence) setStatus("无法显示此 Markdown 文件。");
  }
}

app.addEventListener("toolinput", async ({ arguments: args }) => {
  const uri = args?.file?.resourceUri;
  if (!uri || uri === opened?.uri) return;
  const previous = opened;
  const file = { uri, sequence: 0 };
  opened = file;
  article.replaceChildren();
  setStatus("正在打开文件…");
  if (!extensions.resources) {
    setStatus("当前客户端未提供文件预览接口。");
    return;
  }
  previous?.removeUpdateHandler?.();
  if (previous?.subscribed) {
    extensions.resources.unsubscribe({ uri: previous.uri }).catch(() => {});
  }
  file.removeUpdateHandler = extensions.resources.addUpdateHandler(({ params }) => {
    if (file === opened && params.uri === uri) return refresh(file);
  });
  await refresh(file);
  if (file !== opened) return;
  try {
    await extensions.resources.subscribe({ uri });
    file.subscribed = true;
    if (file === opened) await refresh(file);
    else await extensions.resources.unsubscribe({ uri });
  } catch {
    // Hosts without subscriptions can still open the original file.
  }
});

article.addEventListener("click", (event) => {
  const href = event.target.closest("a[href]")?.getAttribute("href");
  if (!href) return;
  event.preventDefault();
  if (href.startsWith("#")) {
    try {
      document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView();
    } catch {
      // Ignore malformed fragments.
    }
    return;
  }
  app.openLink({ url: href }).catch(() => {});
});

app.addEventListener("hostcontextchanged", ({ theme }) => {
  if (theme) document.documentElement.dataset.theme = theme;
});

app.connect().then(() => {
  const theme = app.getHostContext()?.theme;
  if (theme) document.documentElement.dataset.theme = theme;
}).catch(() => setStatus("无法连接 Codex 文件预览。"));
