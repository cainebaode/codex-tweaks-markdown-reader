import "./reader.css";

const editorSelector = ".cm-editor";
const contentSelector = ":scope > .cm-scroller > .cm-content";
const rowSelector = ".cm-markdown-table-row";
const separatorSelector = ".cm-markdown-table-separator";
const markerSelector = ".file-editor-heading, .cm-markdown-blockquote, .cm-markdown-code-line, .cm-markdown-horizontal-rule, .cm-markdown-list-item, .cm-markdown-table-row";
const readerAttribute = "data-codex-tweaks-markdown-reader";

function findBoldClasses(doc) {
  const classes = new Set();
  const inlineSheets = Array.from(doc.styleSheets).filter(sheet => sheet.ownerNode?.tagName === "STYLE");
  for (const sheet of [...inlineSheets, ...(doc.adoptedStyleSheets ?? [])]) {
    // CodeMirror assigns a generated class to the file preview's strong-emphasis style.
    for (const rule of sheet.cssRules) {
      if (!rule.style || rule.style.length !== 1 || rule.style.fontWeight !== "600") continue;
      const match = rule.selectorText.match(/^\.(ͼ[\p{L}\p{N}_-]+)$/u);
      if (match) classes.add(match[1]);
    }
  }
  return Array.from(classes, name => "span." + CSS.escape(name)).join(", ");
}

function columnWidths(rows, measure) {
  const widths = [];
  let count;
  for (const { element } of rows) {
    let column = 0;
    const header = element.classList.contains("cm-markdown-table-header");
    for (const node of element.childNodes) {
      if (node.nodeType === 3 && !node.textContent.trim()) continue;
      // CodeMirror surrounds a hidden pipe with buffers and an empty widget.
      if (node.nodeType === 1 && node.matches('.cm-widgetBuffer, span[contenteditable="false"]:empty, br:last-child')) continue;
      if (node.nodeType !== 1 || !node.matches(".cm-markdown-table-cell")) return [];
      const width = measure(node.textContent.trim(), header);
      widths[column] = Math.max(widths[column] || 0, width);
      column++;
    }
    // Leave incomplete or actively edited source in the native layout.
    count ??= column;
    if (!count || column !== count) return [];
  }
  return widths;
}

function tableRules(content, scope, canvas) {
  const rules = [];
  let rows = [];
  let font;
  function measure(text, header) {
    font ??= content.ownerDocument.defaultView.getComputedStyle(content);
    canvas.font = `${header ? 700 : 400} ${font.fontSize} ${font.fontFamily}`;
    const em = canvas.measureText(text.slice(0, 160)).width / parseFloat(font.fontSize);
    // Allow for cell padding and borders. Cap prose at a readable line length.
    return Math.ceil(Math.min(38, Math.max(1, em)) + 2);
  }

  function finishTable() {
    if (!rows.length) return;
    const widths = columnWidths(rows, measure);
    if (widths.length) {
      const start = rows[0].position;
      const end = rows.at(-1).position;
      const row = `${scope} > .cm-scroller > .cm-content > ${rowSelector}:nth-child(n+${start}):nth-child(-n+${end})`;
      const preferred = widths.reduce((sum, width) => sum + width, 0);
      // Keep prose tables within reading distance; give multi-column data tables more room.
      const tableWidth = Math.min(preferred, Math.max(72, 16 * widths.length));
      const compact = widths.reduce((sum, width) => sum + Math.min(12, width), 0);
      rules.push(`${row} { inline-size: min(100%, calc(${tableWidth}em + 2px)); }`);
      widths.forEach((width, index) => {
        // Keep labels on one line when space permits; let prose absorb the remaining width.
        const flex = width <= 12
          ? `0 0 min(${width}em, ${(100 * width / compact).toFixed(4)}%)`
          : `1 1 ${width}em`;
        rules.push(`${row} > :nth-child(${index + 1} of .cm-markdown-table-cell) { flex: ${flex}; }`);
      });
    }
    rows = [];
  }

  Array.from(content.children).forEach((element, index) => {
    if (element.matches(rowSelector)) {
      if (element.classList.contains("cm-markdown-table-header")) finishTable();
      rows.push({ element, position: index + 1 });
    } else if (!element.matches(separatorSelector)) {
      finishTable();
    }
  });
  finishTable();
  return rules;
}

export function activate({ root, onCleanup }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const active = new Map();
  const canvas = doc.createElement("canvas").getContext("2d");
  const rules = doc.createElement("style");
  root.append(rules);
  let nextId = 0;
  let queuedFrame = null;

  function refresh() {
    queuedFrame = null;
    const bold = findBoldClasses(doc);
    const boldSelector = bold && `:is(${bold})`;
    const styles = [];
    const currentEditors = new Set();
    for (const editor of doc.querySelectorAll(editorSelector)) {
      const content = editor.querySelector(contentSelector);
      if (!content) continue;
      const isFileEditor = win.getComputedStyle(editor).getPropertyValue("--file-editor-padding").trim();
      if (!isFileEditor) continue;
      const isMarkdown = active.has(editor) || content.querySelector(markerSelector) ||
        (boldSelector && content.querySelector(boldSelector));
      if (!isMarkdown) continue;
      currentEditors.add(editor);

      if (!active.has(editor)) active.set(editor, String(++nextId));
      const id = active.get(editor);
      editor.setAttribute(readerAttribute, id);
      const scope = `.cm-editor[${readerAttribute}="${id}"]`;
      styles.push(...tableRules(content, scope, canvas));
      if (boldSelector) {
        styles.push(`${scope} .cm-line ${boldSelector} {
          font-weight: var(--ct-md-strong-weight);
          -webkit-text-stroke: var(--ct-md-strong-stroke) currentColor;
        }`);
      }
    }

    for (const [editor] of active) {
      if (currentEditors.has(editor)) continue;
      editor.removeAttribute(readerAttribute);
      active.delete(editor);
    }

    const updated = styles.join("\n");
    if (rules.textContent !== updated) rules.textContent = updated;
  }

  function schedule() {
    if (queuedFrame === null) queuedFrame = win.requestAnimationFrame(refresh);
  }

  const observer = new win.MutationObserver(records => {
    for (const { target, addedNodes, removedNodes } of records) {
      const host = target.nodeType === 1 ? target : target.parentElement;
      if (host?.closest(editorSelector) ||
          [...addedNodes, ...removedNodes].some(node =>
            node.nodeType === 1 && (node.matches(editorSelector) || node.querySelector(editorSelector)))) {
        schedule();
        break;
      }
    }
  });

  observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributeFilter: ["class"] });
  schedule();

  onCleanup(() => {
    observer.disconnect();
    if (queuedFrame !== null) win.cancelAnimationFrame(queuedFrame);
    for (const [editor] of active) editor.removeAttribute(readerAttribute);
    for (const editor of doc.querySelectorAll(`[${readerAttribute}]`)) {
      editor.removeAttribute(readerAttribute);
    }
    active.clear();
    rules.remove();
  });
}
