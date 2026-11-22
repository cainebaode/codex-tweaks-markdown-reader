import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const version = "0.1.0";
const title = "Markdown 阅读器";
const mimeType = "text/html;profile=mcp-app";
const uiUri = "ui://codex-markdown-reader/viewer.html";
const server = new McpServer({ name: "codex-markdown-reader", title, version });
const viewer = await readFile(new URL("./viewer.html", import.meta.url), "utf8");

server.registerResource("markdown-reader", uiUri, { mimeType }, async () => ({
  contents: [{
    uri: uiUri,
    mimeType,
    text: viewer,
    _meta: { ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: [] } } },
  }],
}));

server.registerTool("open_markdown", {
  title,
  description: "Open a read-only Markdown preview using a host-managed file resource.",
  inputSchema: {
    file: z.object({ name: z.string().min(1), resourceUri: z.string().min(1) }),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  _meta: {
    ui: { resourceUri: uiUri, visibility: ["app"] },
    "openai/ui": { entrypoints: [{ type: "file", extensions: [".md", ".markdown"] }] },
  },
}, async ({ file }) => /\.(?:md|markdown)$/i.test(file.name)
  ? { content: [] }
  : { isError: true, content: [{ type: "text", text: "This reader supports Markdown files." }] });

await server.connect(new StdioServerTransport());
