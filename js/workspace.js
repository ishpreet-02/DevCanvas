import {
  createProject,
  saveProject,
  getProject
} from "./projects.js";

import {
  getSettings
} from "./settingsStore.js";

import {
  readProjectFiles
} from "./files.js";

import {
  exportProjectFiles
} from "./export.js";

import {
  createUIHelpers
} from "./ui.js";

import {
  registerServiceWorker
} from "./serviceWorker.js";

const {
  showConfirm,
  showToast
} = createUIHelpers();

const tabs = document.querySelectorAll(".editor-tab");
const editors = document.querySelectorAll(".code-editor");

const htmlEditor = document.getElementById("html-editor");
const cssEditor = document.getElementById("css-editor");
const javascriptEditor = document.getElementById("javascript-editor");

const runButton = document.getElementById("run-button");
const saveButton = document.getElementById("save-button");
const renameButton = document.getElementById("rename-button");
const dashboardLink = document.getElementById("dashboard-link");

const previewFrame = document.getElementById("preview-frame");
const previewSizeButtons = document.querySelectorAll(".preview-size-button");
const previewDevice = document.getElementById("preview-device");

const fullscreenPreviewButton =
  document.getElementById("fullscreen-preview-button");

const previewPanel =
  document.querySelector(".preview-panel");

const projectNameElement = document.getElementById("project-name");
const saveStatus = document.getElementById("save-status");
const statusDot = document.getElementById("status-dot");

const consoleToggleButton = document.getElementById("console-toggle-button");
const consoleDrawer = document.getElementById("console-drawer");
const consoleOutput = document.getElementById("console-output");
const consoleCount = document.getElementById("console-count");

const clearConsoleButton = document.getElementById("clear-console-button");
const closeConsoleButton = document.getElementById("close-console-button");
const expandConsoleButton = document.getElementById("expand-console-button");

const renameDialog = document.getElementById("rename-dialog");
const renameForm = document.getElementById("rename-form");
const renameProjectName = document.getElementById("rename-project-name");
const cancelRenameButton = document.getElementById("cancel-rename-button");

const fileModalDialog = document.getElementById("file-modal-dialog");
const fileModalForm = document.getElementById("file-modal-form");
const fileModalTitle = document.getElementById("file-modal-title");
const fileModalDescription = document.getElementById("file-modal-description");
const fileModalLabel = document.getElementById("file-modal-label");
const fileModalName = document.getElementById("file-modal-name");
const cancelFileModalButton = document.getElementById("cancel-file-modal-button");
const fileModalSubmitButton = document.getElementById("file-modal-submit-button");

const importFilesButton = document.getElementById("import-files-button");
const exportProjectButton = document.getElementById("export-project-button");
const copyCodeButton = document.getElementById("copy-code-button");
const workspaceFileInput = document.getElementById("workspace-file-input");
const fileTree = document.getElementById("file-tree");
const addFileButton = document.getElementById("add-file-button");
const activeFileLabel = document.getElementById("active-file-label");

const workspaceStage =
  document.querySelector(".workspace-stage");

const dragOverlay =
  document.getElementById("drag-overlay");

let previewTimer;
let autosaveTimer;
let consoleMessages = 0;
let dragCounter = 0;

let currentProject = null;
let workspaceSettings = null;

let projectFiles = {};

let activeFileName = "index.html";

let selectedFileByType = {
  html: "index.html",
  css: "style.css",
  javascript: "script.js"
};

let isLoadingProject = false;
let hasChanges = false;
let pendingNavigation = null;
let renameMode = "rename";

const AUTOSAVE_DELAY = 1500;
const PREVIEW_DELAY = 500;

const starterProject = {
  html: `<h1>Hello DevCanvas</h1>
<p>Start building your project.</p>`,

  css: `body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px;
}

h1 {
  color: #4f7cff;
}`,

  javascript: `console.log("DevCanvas project started");`
};

function applyWorkspaceSettings() {
  if (!workspaceSettings) {
    return;
  }

  editors.forEach(editor => {
    const editorName = editor.id.replace(/-editor$/, "");
    const highlight = document.getElementById(`${editorName}-highlight`);
    const lineNumbers = document.getElementById(`${editorName}-line-numbers`);
    const lineNumbersContent = document.getElementById(
      `${editorName}-line-numbers-content`
    );

    editor.style.fontSize = `${workspaceSettings.fontSize}px`;
    editor.style.tabSize = workspaceSettings.tabSize;

    editor.classList.toggle(
      "editor-theme-light",
      workspaceSettings.editorTheme === "light"
    );

    [highlight, lineNumbers, lineNumbersContent].forEach(element => {
      if (!element) {
        return;
      }

      element.style.fontSize = `${workspaceSettings.fontSize}px`;
      element.style.tabSize = workspaceSettings.tabSize;
    });
  });

  const editorContainer = document.querySelector(".editor-container");

  editorContainer.classList.toggle(
    "editor-theme-light",
    workspaceSettings.editorTheme === "light"
  );

  consoleToggleButton.classList.toggle(
    "console-disabled",
    !workspaceSettings.showConsole
  );

  if (!workspaceSettings.showConsole) {
    closeConsole();
  }

  refreshAllEditorDecorations();
}

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function switchEditor(editorName) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.editor === editorName);
  });

  document.querySelectorAll(".code-editor-shell").forEach(shell => {
    shell.classList.toggle(
      "active",
      shell.dataset.editorShell === editorName
    );
  });

  editors.forEach(editor => {
    const isActive = editor.id === `${editorName}-editor`;

    editor.classList.toggle("active", isActive);

    if (isActive) {
      syncEditorDecoration(editor);
    }
  });

  if (
    selectedFileByType[editorName] &&
    typeof projectFiles[selectedFileByType[editorName]] === "string"
  ) {
    activeFileName = selectedFileByType[editorName];
  }

  if (activeFileLabel) {
    activeFileLabel.textContent = activeFileName;
  }
}

function getFileType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "html") return "html";
  if (extension === "css") return "css";
  if (extension === "js") return "javascript";

  return null;
}

function getEditorForType(type) {
  if (type === "html") return htmlEditor;
  if (type === "css") return cssEditor;
  if (type === "javascript") return javascriptEditor;

  return null;
}

function findFileByType(files, type) {
  const preferredNames = {
    html: ["index.html"],
    css: ["style.css"],
    javascript: ["script.js", "main.js"]
  };

  for (const name of preferredNames[type] || []) {
    if (typeof files[name] === "string") {
      return name;
    }
  }

  return Object.keys(files)
    .filter(name => getFileType(name) === type)
    .sort((a, b) => a.localeCompare(b))[0] || null;
}

function normalizeWorkspaceFiles(project = {}) {
  const files = {};

  if (project.files && typeof project.files === "object") {
    for (const [name, content] of Object.entries(project.files)) {
      if (
        typeof content === "string" &&
        !name.includes("/") &&
        !name.includes("\\") &&
        /\.(html|css|js)$/i.test(name)
      ) {
        files[name] = content;
      }
    }
  }

  // Migrate projects that only have the original three fields.
  if (Object.keys(files).length === 0) {
    files["index.html"] = project.html ?? starterProject.html;
    files["style.css"] = project.css ?? starterProject.css;
    files["script.js"] = project.javascript ?? starterProject.javascript;

    return files;
  }

  // Keep all three editor types available, even for partial imports.
  if (!Object.keys(files).some(name => getFileType(name) === "html")) {
    files["index.html"] = project.html ?? starterProject.html;
  }

  if (!Object.keys(files).some(name => getFileType(name) === "css")) {
    files["style.css"] = project.css ?? starterProject.css;
  }

  if (!Object.keys(files).some(name => getFileType(name) === "javascript")) {
    files["script.js"] = project.javascript ?? starterProject.javascript;
  }

  return files;
}

function syncActiveEditorToFiles() {
  const type = getFileType(activeFileName);
  const editor = getEditorForType(type);

  if (editor && activeFileName) {
    projectFiles[activeFileName] = editor.value;
  }
}

function selectProjectFile(fileName) {
  if (typeof projectFiles[fileName] !== "string") {
    return;
  }

  syncActiveEditorToFiles();

  const type = getFileType(fileName);
  const editor = getEditorForType(type);

  if (!editor || !type) {
    return;
  }

  selectedFileByType[type] = fileName;
  activeFileName = fileName;

  editor.value = projectFiles[fileName];

  switchEditor(type);
  refreshEditorDecoration(editor);
  renderFileTree();
}

function markProjectChanged() {
  hasChanges = true;
  markUnsaved();

  if (workspaceSettings?.livePreview) {
    schedulePreview();
  }

  if (currentProject && workspaceSettings?.autosave) {
    scheduleAutosave();
  }
}

function validateProjectFileName(fileName, oldName = null) {
  const name = fileName.trim();

  if (
    !/^[A-Za-z0-9 _.-]+\.(html|css|js)$/i.test(name) ||
    name.includes("..")
  ) {
    return "Use a root-level filename ending in .html, .css or .js.";
  }

  const duplicate = Object.keys(projectFiles).some(existingName => {
    return (
      existingName.toLowerCase() === name.toLowerCase() &&
      existingName !== oldName
    );
  });

  if (duplicate) {
    return "A file with that name already exists.";
  }

  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateHTMLFileReferences(oldName, newName) {
  const pattern = new RegExp(
    `(\\b(?:src|href)\\s*=\\s*["'])(?:\\./)?${escapeRegExp(oldName)}(["'])`,
    "gi"
  );

  for (const fileName of Object.keys(projectFiles)) {
    if (getFileType(fileName) !== "html") {
      continue;
    }

    projectFiles[fileName] = projectFiles[fileName].replace(
      pattern,
      `$1${newName}$2`
    );
  }
}

function renderFileTree() {
  if (!fileTree) {
    return;
  }

  fileTree.replaceChildren();

  const typeOrder = {
    html: 0,
    css: 1,
    javascript: 2
  };

  const fileNames = Object.keys(projectFiles).sort((a, b) => {
    const typeDifference =
      typeOrder[getFileType(a)] - typeOrder[getFileType(b)];

    return typeDifference || a.localeCompare(b);
  });

  for (const fileName of fileNames) {
    const type = getFileType(fileName);

    const row = document.createElement("div");
    row.className = "file-tree-row";
    row.setAttribute("role", "listitem");

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "file-tree-item";
    selectButton.dataset.fileName = fileName;
    selectButton.classList.toggle("active", fileName === activeFileName);
    selectButton.title = fileName;

    const icon = document.createElement("span");
    icon.className = `file-type-icon ${type}`;
    icon.textContent = type === "javascript" ? "JS" : type.toUpperCase();

    const name = document.createElement("span");
    name.className = "file-tree-name";
    name.textContent = fileName;

    selectButton.append(icon, name);

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "file-tree-action";
    renameButton.dataset.fileName = fileName;
    renameButton.dataset.fileAction = "rename";
    renameButton.textContent = "✎";
    renameButton.title = `Rename ${fileName}`;
    renameButton.setAttribute("aria-label", `Rename ${fileName}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "file-tree-action delete";
    deleteButton.dataset.fileName = fileName;
    deleteButton.dataset.fileAction = "delete";
    deleteButton.textContent = "×";
    deleteButton.title = `Delete ${fileName}`;
    deleteButton.setAttribute("aria-label", `Delete ${fileName}`);

    row.append(selectButton, renameButton, deleteButton);
    fileTree.appendChild(row);
  }

  if (activeFileLabel) {
    activeFileLabel.textContent = activeFileName;
  }
}

function promptFileModal({
  title = "File",
  description = "",
  label = "File Name",
  defaultValue = "",
  submitText = "Save"
}) {
  if (!fileModalDialog) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    fileModalTitle.textContent = title;
    fileModalDescription.textContent = description;
    fileModalLabel.textContent = label;
    fileModalName.value = defaultValue;
    fileModalSubmitButton.textContent = submitText;

    function cleanup() {
      fileModalForm.removeEventListener("submit", handleSubmit);
      cancelFileModalButton.removeEventListener("click", handleCancel);
      fileModalDialog.removeEventListener("cancel", handleCancel);
    }

    function handleSubmit(event) {
      event.preventDefault();
      const value = fileModalName.value.trim();
      cleanup();
      fileModalDialog.close();
      resolve(value);
    }

    function handleCancel() {
      cleanup();
      fileModalDialog.close();
      resolve(null);
    }

    fileModalForm.addEventListener("submit", handleSubmit);
    cancelFileModalButton.addEventListener("click", handleCancel);
    fileModalDialog.addEventListener("cancel", handleCancel);

    fileModalDialog.showModal();
    fileModalName.focus();

    const lastDot = defaultValue.lastIndexOf(".");
    if (lastDot > 0) {
      fileModalName.setSelectionRange(0, lastDot);
    } else {
      fileModalName.select();
    }
  });
}

async function addProjectFile() {
  const activeType = getFileType(activeFileName) || "javascript";
  const extension = activeType === "javascript" ? "js" : activeType;
  const defaultName = `new-file.${extension}`;

  const enteredName = await promptFileModal({
    title: "New File",
    description: "Create a new HTML, CSS, or JavaScript file in your project.",
    label: "File Name",
    defaultValue: defaultName,
    submitText: "Create File"
  });

  if (enteredName === null) {
    return;
  }

  const fileName = enteredName.trim();
  const error = validateProjectFileName(fileName);

  if (error) {
    showToast(error, "error");
    return;
  }

  syncActiveEditorToFiles();

  projectFiles[fileName] = "";
  selectProjectFile(fileName);
  renderFileTree();
  markProjectChanged();
}

async function renameProjectFile(oldName) {
  const enteredName = await promptFileModal({
    title: "Rename File",
    description: `Enter a new name for "${oldName}". References in HTML will be updated.`,
    label: "File Name",
    defaultValue: oldName,
    submitText: "Rename"
  });

  if (enteredName === null) {
    return;
  }

  const newName = enteredName.trim();
  const error = validateProjectFileName(newName, oldName);

  if (error) {
    showToast(error, "error");
    return;
  }

  if (newName === oldName) {
    return;
  }

  syncActiveEditorToFiles();

  projectFiles[newName] = projectFiles[oldName];
  delete projectFiles[oldName];

  updateHTMLFileReferences(oldName, newName);

  for (const type of Object.keys(selectedFileByType)) {
    if (selectedFileByType[type] === oldName) {
      selectedFileByType[type] = newName;
    }
  }

  if (activeFileName === oldName) {
    activeFileName = newName;
  }

  renderFileTree();
  markProjectChanged();
}

async function deleteProjectFile(fileName) {
  const type = getFileType(fileName);

  const filesOfType = Object.keys(projectFiles).filter(name => {
    return getFileType(name) === type;
  });

  if (filesOfType.length <= 1) {
    showToast(
      `Keep at least one ${type === "javascript" ? "JavaScript" : type.toUpperCase()} file in the project.`,
      "error"
    );
    return;
  }

  const confirmed = await showConfirm({
    title: "Delete File",
    message: `Are you sure you want to delete "${fileName}"? This cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger"
  });

  if (!confirmed) {
    return;
  }

  syncActiveEditorToFiles();

  delete projectFiles[fileName];

  if (selectedFileByType[type] === fileName) {
    selectedFileByType[type] = findFileByType(projectFiles, type);
  }

  if (activeFileName === fileName) {
    activeFileName = selectedFileByType[type];
  }

  selectProjectFile(activeFileName);
  renderFileTree();
  markProjectChanged();
}

fileTree?.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-file-action]");

  if (actionButton) {
    const { fileName, fileAction } = actionButton.dataset;

    if (fileAction === "rename") {
      renameProjectFile(fileName);
    } else if (fileAction === "delete") {
      deleteProjectFile(fileName);
    }

    return;
  }

  const fileButton = event.target.closest("[data-file-name]");

  if (fileButton) {
    selectProjectFile(fileButton.dataset.fileName);
  }
});

addFileButton?.addEventListener("click", addProjectFile);

function escapeEditorHTML(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syntaxToken(value, type) {
  return `<span class="syntax-${type}">${escapeEditorHTML(value)}</span>`;
}

function highlightHTMLTag(tag) {
  const tokens = tag.match(
    /<\/?|\/?>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_:][\w:.-]*|=|\s+|./g
  ) || [];

  let waitingForTagName = true;

  return tokens.map((token, index) => {
    if (
      token === "<" ||
      token === "</" ||
      token === ">" ||
      token === "/>" ||
      token === "="
    ) {
      return syntaxToken(token, "punctuation");
    }

    if (waitingForTagName && /^[A-Za-z]/.test(token)) {
      waitingForTagName = false;
      return syntaxToken(token, "tag");
    }

    if (/^["']/.test(token)) {
      return syntaxToken(token, "attribute-value");
    }

    if (/^[A-Za-z_:][\w:.-]*$/.test(token)) {
      let nextIndex = index + 1;

      while (
        nextIndex < tokens.length &&
        /^\s+$/.test(tokens[nextIndex])
      ) {
        nextIndex++;
      }

      if (tokens[nextIndex] === "=") {
        return syntaxToken(token, "attribute");
      }
    }

    return escapeEditorHTML(token);
  }).join("");
}

function highlightHTML(source) {
  const tagPattern =
    /<!--[\s\S]*?-->|<!DOCTYPE\b[^>]*>|<\/?[A-Za-z][^>]*>/gi;

  let result = "";
  let cursor = 0;

  for (const match of source.matchAll(tagPattern)) {
    result += escapeEditorHTML(source.slice(cursor, match.index));

    const token = match[0];

    if (token.startsWith("<!--")) {
      result += syntaxToken(token, "comment");
    } else if (/^<!DOCTYPE/i.test(token)) {
      result += syntaxToken(token, "doctype");
    } else {
      result += highlightHTMLTag(token);
    }

    cursor = match.index + token.length;
  }

  result += escapeEditorHTML(source.slice(cursor));

  return result;
}

function highlightCSS(source) {
  const pattern =
    /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[0-9a-fA-F]{3,8}\b|--[\w-]+|@[\w-]+|[.#][A-Za-z_-][\w-]*|!\s*important\b|\b\d+(?:\.\d+)?(?:%|px|rem|em|vh|vw|vmin|vmax|ms|s|deg|fr)?|[A-Za-z_-][\w-]*(?=\s*:)|\b(?:inherit|initial|unset|revert|none|auto|flex|grid|block|inline|relative|absolute|fixed|sticky|solid|transparent|currentColor|important)\b|[\{\}\(\)\[\]:;,]|\s+|./gs;

  let result = "";

  for (const match of source.matchAll(pattern)) {
    const token = match[0];
    let type = "";

    if (token.startsWith("/*")) {
      type = "comment";
    } else if (/^["']/.test(token)) {
      type = "string";
    } else if (/^#[0-9a-f]{3,8}$/i.test(token)) {
      type = "color";
    } else if (token.startsWith("--")) {
      type = "variable";
    } else if (token.startsWith("@")) {
      type = "at-rule";
    } else if (/^[.#]/.test(token)) {
      type = "selector";
    } else if (/^!\s*important$/i.test(token)) {
      type = "keyword";
    } else if (/^\d/.test(token)) {
      type = "number";
    } else if (
      /^[A-Za-z_-][\w-]*$/.test(token) &&
      /^\s*:/.test(source.slice(match.index + token.length))
    ) {
      type = "property";
    } else if (
      /^(inherit|initial|unset|revert|none|auto|flex|grid|block|inline|relative|absolute|fixed|sticky|solid|transparent|currentColor|important)$/i.test(token)
    ) {
      type = "keyword";
    } else if ("{}()[]:;,".includes(token)) {
      type = "punctuation";
    }

    result += type
      ? syntaxToken(token, type)
      : escapeEditorHTML(token);
  }

  return result;
}

function highlightJavaScript(source) {
  const pattern =
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|this|super|try|catch|finally|throw|async|await|import|export|from|default|of|in|instanceof|typeof|void|delete|yield)\b|\b(?:true|false|null|undefined|NaN|Infinity)\b|\b\d+(?:\.\d+)?n?\b|\b(?:console|window|document|Math|Array|Object|String|Number|Boolean|Promise|JSON|Date|Error|Map|Set|RegExp)\b|[A-Za-z_$][\w$]*(?=\s*\()|[\{\}\(\)\[\].,;:?=+\-*\/%<>!&|~^]|\s+|./gs;

  const keywords = new Set([
    "const", "let", "var", "function", "return", "if", "else",
    "for", "while", "do", "switch", "case", "break", "continue",
    "new", "class", "extends", "this", "super", "try", "catch",
    "finally", "throw", "async", "await", "import", "export",
    "from", "default", "of", "in", "instanceof", "typeof", "void",
    "delete", "yield"
  ]);

  const literals = new Set([
    "true", "false", "null", "undefined", "NaN", "Infinity"
  ]);

  const builtins = new Set([
    "console", "window", "document", "Math", "Array", "Object",
    "String", "Number", "Boolean", "Promise", "JSON", "Date",
    "Error", "Map", "Set", "RegExp"
  ]);

  let result = "";

  for (const match of source.matchAll(pattern)) {
    const token = match[0];
    let type = "";

    if (token.startsWith("//") || token.startsWith("/*")) {
      type = "comment";
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      type = "string";
    } else if (keywords.has(token)) {
      type = "keyword";
    } else if (literals.has(token)) {
      type = "boolean";
    } else if (/^\d/.test(token)) {
      type = "number";
    } else if (builtins.has(token)) {
      type = "builtin";
    } else if (/^[A-Za-z_$][\w$]*$/.test(token) && /^\s*\(/.test(source.slice(match.index + token.length))) {
      type = "function";
    } else if ("{}()[].,;:".includes(token)) {
      type = "punctuation";
    } else if (/^[=+\-*\/%<>!&|~^?]$/.test(token)) {
      type = "operator";
    }

    result += type
      ? syntaxToken(token, type)
      : escapeEditorHTML(token);
  }

  return result;
}

function syncEditorDecoration(editor) {
  const editorName = editor.id.replace(/-editor$/, "");
  const highlight = document.getElementById(`${editorName}-highlight`);
  const lineNumbers = document.getElementById(`${editorName}-line-numbers`);

  if (!highlight || !lineNumbers) {
    return;
  }

  highlight.style.transform =
    `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;

  lineNumbers.scrollTop = editor.scrollTop;
}

function refreshEditorDecoration(editor) {
  const editorName = editor.id.replace(/-editor$/, "");
  const highlight = document.getElementById(`${editorName}-highlight`);
  const lineNumbersContent = document.getElementById(
    `${editorName}-line-numbers-content`
  );

  if (!highlight || !lineNumbersContent) {
    return;
  }

  const source = editor.value || "";
  let highlightedCode = "";

  if (editorName === "html") {
    highlightedCode = highlightHTML(source);
  } else if (editorName === "css") {
    highlightedCode = highlightCSS(source);
  } else if (editorName === "javascript") {
    highlightedCode = highlightJavaScript(source);
  }

  highlight.innerHTML = highlightedCode +
    (source.endsWith("\n") ? "&#8203;" : "");

  const lineCount = source.split("\n").length;

  lineNumbersContent.textContent = Array.from(
    { length: lineCount },
    (_, index) => index + 1
  ).join("\n");

  syncEditorDecoration(editor);
}

function refreshAllEditorDecorations() {
  editors.forEach(editor => {
    refreshEditorDecoration(editor);
  });
}

editors.forEach(editor => {
  editor.addEventListener("scroll", () => {
    syncEditorDecoration(editor);
  });
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchEditor(tab.dataset.editor);
  });
});

function handleTabKey(editor) {
  editor.addEventListener("keydown", event => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const tabSize = workspaceSettings?.tabSize || 2;
    const spaces = " ".repeat(tabSize);

    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value =
      editor.value.substring(0, start) +
      spaces +
      editor.value.substring(end);

    const cursorPosition = start + spaces.length;

    editor.selectionStart = cursorPosition;
    editor.selectionEnd = cursorPosition;

    editor.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );
  });
}

handleTabKey(htmlEditor);
handleTabKey(cssEditor);
handleTabKey(javascriptEditor);

function setPreviewSize(size) {
  previewDevice.classList.remove(
    "desktop",
    "tablet",
    "mobile"
  );

  previewDevice.classList.add(size);

  previewSizeButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.previewSize === size
    );
  });
}

previewSizeButtons.forEach(button => {
  button.addEventListener("click", () => {
    setPreviewSize(button.dataset.previewSize);
  });
});

async function toggleFullscreenPreview() {
  try {
    if (!document.fullscreenElement) {
      await previewPanel.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  } catch (error) {
    console.error("Fullscreen failed:", error);

    showToast(
      "Unable to open fullscreen preview.",
      "error"
    );
  }
}

fullscreenPreviewButton.addEventListener(
  "click",
  toggleFullscreenPreview
);

document.addEventListener("fullscreenchange", () => {
  const isFullscreen =
    document.fullscreenElement === previewPanel;

  fullscreenPreviewButton.classList.toggle(
    "active",
    isFullscreen
  );

  fullscreenPreviewButton.setAttribute(
    "aria-label",
    isFullscreen
      ? "Exit Fullscreen Preview"
      : "Open Fullscreen Preview"
  );

  fullscreenPreviewButton.dataset.tooltip =
    isFullscreen
      ? "Exit Fullscreen"
      : "Fullscreen Preview";
});

function getActiveEditor() {
  return document.querySelector(".code-editor.active");
}

async function copyActiveEditorCode() {
  const activeEditor = getActiveEditor();

  if (!activeEditor) {
    return;
  }

  try {
    await navigator.clipboard.writeText(activeEditor.value);

    copyCodeButton.textContent = "Copied";
    copyCodeButton.classList.add("copied");

    setTimeout(() => {
      copyCodeButton.textContent = "Copy";
      copyCodeButton.classList.remove("copied");
    }, 1200);
  } catch (error) {
    console.error("Failed to copy code:", error);

    copyCodeButton.textContent = "Failed";
    showToast("Unable to copy code to clipboard.", "error");

    setTimeout(() => {
      copyCodeButton.textContent = "Copy";
    }, 1200);
  }
}

copyCodeButton.addEventListener("click", copyActiveEditorCode);

function setSaveStatus(type, text) {
  statusDot.className = `status-dot ${type}`;
  saveStatus.textContent = text;
}

function markUnsaved() {
  setSaveStatus("unsaved", "Unsaved changes");
}

function markSaving() {
  setSaveStatus("saving", "Saving...");
}

function markSaved() {
  setSaveStatus("saved", "Saved locally");
}

function markSaveError() {
  setSaveStatus("error", "Save failed");
}

function openConsole() {
  consoleDrawer.classList.add("open");
  consoleToggleButton.classList.add("open");
  consoleToggleButton.classList.remove("has-error");
}

function closeConsole() {
  consoleDrawer.classList.remove("open");
  consoleToggleButton.classList.remove("open");
}

function toggleConsole() {
  if (consoleDrawer.classList.contains("open")) {
    closeConsole();
  } else {
    openConsole();
  }
}

consoleToggleButton.addEventListener("click", toggleConsole);
closeConsoleButton.addEventListener("click", closeConsole);

expandConsoleButton.addEventListener("click", () => {
  consoleDrawer.classList.toggle("expanded");
});

function clearConsole() {
  consoleMessages = 0;
  consoleCount.textContent = "0";

  consoleOutput.innerHTML = `
    <div class="console-empty">
      Console output will appear here.
    </div>
  `;
}

clearConsoleButton.addEventListener("click", clearConsole);

function addConsoleMessage(level, message) {
  const emptyMessage = consoleOutput.querySelector(".console-empty");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  consoleMessages++;
  consoleCount.textContent = consoleMessages;

  const entry = document.createElement("div");
  entry.className = `console-entry ${level}`;

  const type = document.createElement("span");
  type.className = "console-entry-type";
  type.textContent = level;

  const output = document.createElement("span");
  output.className = "console-entry-message";
  output.textContent = message;

  entry.append(type, output);
  consoleOutput.appendChild(entry);

  consoleOutput.scrollTop = consoleOutput.scrollHeight;

  if (level === "error") {
    consoleToggleButton.classList.add("has-error");
  }
}

function createConsoleBridge() {
  return `
    <script>
      (function () {
        function serialize(value) {
          if (value instanceof Error) {
            return value.name + ": " + value.message;
          }

          if (typeof value === "object" && value !== null) {
            try {
              return JSON.stringify(value, null, 2);
            } catch (error) {
              return String(value);
            }
          }

          return String(value);
        }

        function sendConsole(level, args) {
          window.parent.postMessage({
            source: "devcanvas-preview",
            type: "console",
            level: level,
            message: args.map(serialize).join(" ")
          }, "*");
        }

        const originalLog = console.log;
        const originalInfo = console.info;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = function (...args) {
          sendConsole("log", args);
          originalLog.apply(console, args);
        };

        console.info = function (...args) {
          sendConsole("info", args);
          originalInfo.apply(console, args);
        };

        console.warn = function (...args) {
          sendConsole("warn", args);
          originalWarn.apply(console, args);
        };

        console.error = function (...args) {
          sendConsole("error", args);
          originalError.apply(console, args);
        };

        window.addEventListener("error", function (event) {
          window.parent.postMessage({
            source: "devcanvas-preview",
            type: "runtime-error",
            level: "error",
            message:
              event.message +
              (event.lineno ? " | Line " + event.lineno : "") +
              (event.colno ? ":" + event.colno : "")
          }, "*");
        });

        window.addEventListener("unhandledrejection", function (event) {
          window.parent.postMessage({
            source: "devcanvas-preview",
            type: "runtime-error",
            level: "error",
            message:
              "Unhandled Promise Rejection: " +
              serialize(event.reason)
          }, "*");
        });
      })();
    <\/script>
  `;
}

function getReferencedProjectFile(reference) {
  if (!reference) {
    return "";
  }

  let cleanReference = reference.split(/[?#]/)[0];

  try {
    cleanReference = decodeURIComponent(cleanReference);
  } catch {
    // Keep the original path if it cannot be decoded.
  }

  return cleanReference.split(/[\\/]/).pop();
}

function escapeClosingTag(source, tagName) {
  const pattern = new RegExp(`</${tagName}`, "gi");
  return source.replace(pattern, `<\\/${tagName}`);
}

function buildPreview() {
  clearConsole();
  syncActiveEditorToFiles();

  const htmlName = selectedFileByType.html;
  const htmlSource = projectFiles[htmlName] ?? htmlEditor.value;

  const parsed = new DOMParser().parseFromString(
    htmlSource,
    "text/html"
  );

  let linkedProjectCSS = 0;

  // Inline project CSS while preserving link order and media attributes.
  parsed.querySelectorAll("link[rel][href]").forEach(link => {
    const rel = (link.getAttribute("rel") || "")
      .toLowerCase()
      .split(/\s+/);

    if (!rel.includes("stylesheet")) {
      return;
    }

    const fileName = getReferencedProjectFile(
      link.getAttribute("href")
    );

    if (
      getFileType(fileName) !== "css" ||
      typeof projectFiles[fileName] !== "string"
    ) {
      return;
    }

    const style = parsed.createElement("style");

    if (link.hasAttribute("media")) {
      style.setAttribute("media", link.getAttribute("media"));
    }

    style.textContent = escapeClosingTag(
      projectFiles[fileName],
      "style"
    );

    link.replaceWith(style);
    linkedProjectCSS++;
  });

  // Preserve the original separate-CSS-editor behavior when HTML
  // doesn't reference a project stylesheet.
  if (linkedProjectCSS === 0) {
    const cssName = selectedFileByType.css;

    if (typeof projectFiles[cssName] === "string") {
      const style = parsed.createElement("style");

      style.textContent = escapeClosingTag(
        projectFiles[cssName],
        "style"
      );

      parsed.head.appendChild(style);
    }
  }

  let linkedProjectScripts = 0;

  // Inline each referenced project script in its original HTML order.
  parsed.querySelectorAll("script[src]").forEach(script => {
    const fileName = getReferencedProjectFile(
      script.getAttribute("src")
    );

    if (
      getFileType(fileName) !== "javascript" ||
      typeof projectFiles[fileName] !== "string"
    ) {
      return;
    }

    const inlineScript = parsed.createElement("script");

    for (const attribute of Array.from(script.attributes)) {
      if (attribute.name.toLowerCase() !== "src") {
        inlineScript.setAttribute(attribute.name, attribute.value);
      }
    }

    inlineScript.textContent = escapeClosingTag(
      projectFiles[fileName],
      "script"
    );

    script.replaceWith(inlineScript);
    linkedProjectScripts++;
  });

  // If no local script was referenced, run the selected JS editor
  // as before. Otherwise, let the HTML's script references control order.
  if (linkedProjectScripts === 0) {
    const javascriptName = selectedFileByType.javascript;

    if (typeof projectFiles[javascriptName] === "string") {
      const script = parsed.createElement("script");

      script.textContent = escapeClosingTag(
        projectFiles[javascriptName],
        "script"
      );

      parsed.body.appendChild(script);
    }
  }

  // Insert the existing console bridge before user scripts execute.
  const bridgeMarkup = createConsoleBridge();
  const bridgeSource = bridgeMarkup
    .replace(/^<script>\s*/i, "")
    .replace(/\s*<\/script>$/i, "");

  const bridgeScript = parsed.createElement("script");
  bridgeScript.textContent = bridgeSource;
  parsed.head.prepend(bridgeScript);

  previewFrame.srcdoc =
    "<!DOCTYPE html>\n" + parsed.documentElement.outerHTML;
}

function schedulePreview() {
  clearTimeout(previewTimer);

  previewTimer = setTimeout(() => {
    buildPreview();
  }, PREVIEW_DELAY);
}

function getEditorData() {
  syncActiveEditorToFiles();

  const htmlFile = selectedFileByType.html;
  const cssFile = selectedFileByType.css;
  const javascriptFile = selectedFileByType.javascript;

  return {
    html: projectFiles[htmlFile] ?? "",
    css: projectFiles[cssFile] ?? "",
    javascript: projectFiles[javascriptFile] ?? "",
    files: { ...projectFiles }
  };
}

function applyEditorData(project) {
  projectFiles = normalizeWorkspaceFiles(project);

  selectedFileByType = {
    html: findFileByType(projectFiles, "html"),
    css: findFileByType(projectFiles, "css"),
    javascript: findFileByType(projectFiles, "javascript")
  };

  htmlEditor.value = projectFiles[selectedFileByType.html] ?? "";
  cssEditor.value = projectFiles[selectedFileByType.css] ?? "";
  javascriptEditor.value =
    projectFiles[selectedFileByType.javascript] ?? "";

  activeFileName = selectedFileByType.html;

  switchEditor("html");
  renderFileTree();
  refreshAllEditorDecorations();
}

function importFilesIntoEditors(projectData) {
  syncActiveEditorToFiles();

  const incomingFiles = {};

  if (
    projectData.files &&
    typeof projectData.files === "object"
  ) {
    Object.assign(incomingFiles, projectData.files);
  } else {
    // Compatibility with the original importer format.
    if (projectData.html !== null && projectData.html !== undefined) {
      incomingFiles[selectedFileByType.html] = projectData.html;
    }

    if (projectData.css !== null && projectData.css !== undefined) {
      incomingFiles[selectedFileByType.css] = projectData.css;
    }

    if (
      projectData.javascript !== null &&
      projectData.javascript !== undefined
    ) {
      incomingFiles[selectedFileByType.javascript] =
        projectData.javascript;
    }
  }

  const importedTypes = new Set(
    Object.keys(incomingFiles).map(getFileType).filter(Boolean)
  );

  // Replace files only for languages included in this import.
  // Files in other languages remain untouched.
  for (const name of Object.keys(projectFiles)) {
    if (importedTypes.has(getFileType(name))) {
      delete projectFiles[name];
    }
  }

  Object.assign(projectFiles, incomingFiles);

  // Ensure all three existing editor tabs have a file.
  projectFiles = normalizeWorkspaceFiles({
    files: projectFiles,
    html: projectFiles[selectedFileByType.html],
    css: projectFiles[selectedFileByType.css],
    javascript: projectFiles[selectedFileByType.javascript]
  });

  for (const type of importedTypes) {
    selectedFileByType[type] = findFileByType(projectFiles, type);
  }

  if (importedTypes.has("html")) {
    activeFileName = selectedFileByType.html;
  } else if (importedTypes.has("css")) {
    activeFileName = selectedFileByType.css;
  } else if (importedTypes.has("javascript")) {
    activeFileName = selectedFileByType.javascript;
  }

  const htmlName = selectedFileByType.html;
  const cssName = selectedFileByType.css;
  const javascriptName = selectedFileByType.javascript;

  htmlEditor.value = projectFiles[htmlName] ?? "";
  cssEditor.value = projectFiles[cssName] ?? "";
  javascriptEditor.value = projectFiles[javascriptName] ?? "";

  switchEditor(getFileType(activeFileName));
  renderFileTree();
  refreshAllEditorDecorations();

  markProjectChanged();
  buildPreview();

  showToast("Files imported successfully.", "success");
}

function openWorkspaceFilePicker() {
  workspaceFileInput.click();
}

function applyStarterProject() {
  projectFiles = {
    "index.html": starterProject.html,
    "style.css": starterProject.css,
    "script.js": starterProject.javascript
  };

  selectedFileByType = {
    html: "index.html",
    css: "style.css",
    javascript: "script.js"
  };

  activeFileName = "index.html";

  htmlEditor.value = projectFiles["index.html"];
  cssEditor.value = projectFiles["style.css"];
  javascriptEditor.value = projectFiles["script.js"];

  switchEditor("html");
  renderFileTree();
  refreshAllEditorDecorations();

  projectNameElement.textContent = "Untitled Project";
  setSaveStatus("unsaved", "New project");
  hasChanges = false;
}

function updateProjectURL(projectId) {
  const url = new URL(window.location.href);

  url.searchParams.set("id", projectId);

  window.history.replaceState({}, "", url);
}

async function saveCurrentProject() {
  if (!currentProject) {
    openNameProjectDialog();
    return;
  }

  try {
    markSaving();

    const editorData = getEditorData();

    currentProject.files = editorData.files;
    currentProject.html = editorData.html;
    currentProject.css = editorData.css;
    currentProject.javascript = editorData.javascript;

    await saveProject(currentProject);

    hasChanges = false;
    markSaved();
  } catch (error) {
    console.error("Failed to save project:", error);
    markSaveError();
  }
}

function scheduleAutosave() {
  if (!currentProject || isLoadingProject) {
    return;
  }

  clearTimeout(autosaveTimer);

  markUnsaved();

  autosaveTimer = setTimeout(() => {
    saveCurrentProject();
  }, AUTOSAVE_DELAY);
}

function flushAutosave() {
  if (!currentProject || !hasChanges) {
    return;
  }

  clearTimeout(autosaveTimer);
  saveCurrentProject();
}

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushAutosave();
  }
});

window.addEventListener("pagehide", flushAutosave);

editors.forEach(editor => {
  editor.addEventListener("input", () => {
    if (isLoadingProject) {
      return;
    }

    refreshEditorDecoration(editor);
    syncActiveEditorToFiles();

    hasChanges = true;
    markUnsaved();

    if (workspaceSettings?.livePreview) {
      schedulePreview();
    }

    if (currentProject && workspaceSettings?.autosave) {
      scheduleAutosave();
    }
  });
});

runButton.addEventListener("click", () => {
  clearTimeout(previewTimer);
  buildPreview();
});

saveButton.addEventListener("click", async () => {
  clearTimeout(autosaveTimer);

  if (!currentProject) {
    openNameProjectDialog();
    return;
  }

  await saveCurrentProject();
});

importFilesButton.addEventListener("click", openWorkspaceFilePicker);

exportProjectButton.addEventListener("click", () => {
  const projectData = getEditorData();

  exportProjectFiles(projectData);
});

workspaceFileInput.addEventListener("change", async event => {
  const files = event.target.files;

  if (!files || files.length === 0) {
    return;
  }

  try {
    const { projectData } = await readProjectFiles(files);

    importFilesIntoEditors(projectData);
  } catch (error) {
    console.error("Failed to import files:", error);

    showToast(error.message || "Unable to import project files.", "error");
  } finally {
    workspaceFileInput.value = "";
  }
});

function containsFiles(event) {
  return Array.from(
    event.dataTransfer?.types || []
  ).includes("Files");
}

function handleDragEnter(event) {
  if (!containsFiles(event)) {
    return;
  }

  event.preventDefault();

  dragCounter++;

  dragOverlay.classList.add("active");
}

function handleDragOver(event) {
  if (!containsFiles(event)) {
    return;
  }

  event.preventDefault();

  event.dataTransfer.dropEffect = "copy";
}

function handleDragLeave(event) {
  if (!containsFiles(event)) {
    return;
  }

  event.preventDefault();

  dragCounter--;

  if (dragCounter <= 0) {
    dragCounter = 0;

    dragOverlay.classList.remove("active");
  }
}

async function handleDrop(event) {
  event.preventDefault();

  dragCounter = 0;

  dragOverlay.classList.remove("active");

  const files = event.dataTransfer.files;

  if (!files || files.length === 0) {
    return;
  }

  try {
    const { projectData } =
      await readProjectFiles(files);

    importFilesIntoEditors(
      projectData
    );

    showToast(
      "Files imported successfully.",
      "success"
    );
  } catch (error) {
    console.error(
      "Failed to import dropped files:",
      error
    );

    showToast(
      error.message ||
        "Unable to import dropped files.",
      "error"
    );
  }
}

workspaceStage.addEventListener(
  "dragenter",
  handleDragEnter
);

workspaceStage.addEventListener(
  "dragover",
  handleDragOver
);

workspaceStage.addEventListener(
  "dragleave",
  handleDragLeave
);

workspaceStage.addEventListener(
  "drop",
  handleDrop
);

window.addEventListener("message", event => {
  if (event.source !== previewFrame.contentWindow) {
    return;
  }

  const data = event.data;

  if (!data || data.source !== "devcanvas-preview") {
    return;
  }

  if (data.type === "console" || data.type === "runtime-error") {
    addConsoleMessage(data.level, data.message);
  }
});

function openRenameDialog() {
  if (!currentProject) {
    openNameProjectDialog();
    return;
  }

  renameMode = "rename";

  renameProjectName.value = currentProject.name;

  renameDialog.querySelector("h2").textContent = "Rename Project";

  renameDialog.querySelector(".dialog-header p").textContent =
    "Choose a new name for your DevCanvas project.";

  renameDialog.querySelector('button[type="submit"]').textContent =
    "Rename";

  renameDialog.showModal();

  setTimeout(() => {
    renameProjectName.focus();
    renameProjectName.select();
  }, 0);
}

function openNameProjectDialog() {
  renameMode = "create";

  renameProjectName.value = "";

  renameDialog.querySelector("h2").textContent = "Save New Project";

  renameDialog.querySelector(".dialog-header p").textContent =
    "Enter a name before saving this project.";

  renameDialog.querySelector('button[type="submit"]').textContent =
    "Save Project";

  renameDialog.showModal();

  setTimeout(() => {
    renameProjectName.focus();
  }, 0);
}

function closeRenameDialog() {
  renameDialog.close();

  if (renameMode === "create") {
    pendingNavigation = null;
  }
}

renameButton.addEventListener("click", openRenameDialog);
cancelRenameButton.addEventListener("click", closeRenameDialog);

renameForm.addEventListener("submit", async event => {
  event.preventDefault();

  const newName = renameProjectName.value.trim();

  if (!newName) {
    renameProjectName.focus();
    return;
  }

  try {
    if (renameMode === "create") {
      const editorData = getEditorData();

      currentProject = createProject({
        name: newName,
        ...editorData
      });

      markSaving();

      await saveProject(currentProject);

      updateProjectURL(currentProject.id);

      projectNameElement.textContent = currentProject.name;

      hasChanges = false;

      markSaved();
      renameDialog.close();

      if (pendingNavigation) {
        const destination = pendingNavigation;

        pendingNavigation = null;

        window.location.href = destination;
      }

      return;
    }

    if (!currentProject) {
      return;
    }

    currentProject.name = newName;

    await saveProject(currentProject);

    projectNameElement.textContent = newName;

    markSaved();
    renameDialog.close();
  } catch (error) {
    console.error("Failed to save project:", error);
    markSaveError();
  }
});

async function handleNavigation(event, targetUrl) {
  if (!hasChanges) {
    return;
  }

  event.preventDefault();

  if (currentProject) {
    if (workspaceSettings?.autosave) {
      clearTimeout(autosaveTimer);
      await saveCurrentProject();
      window.location.href = targetUrl;
      return;
    }

    const shouldSave = await showConfirm({
      title: "Save your changes?",
      message:
        "You have unsaved changes in this workspace. Save before leaving?",
      confirmText: "Save Changes",
      cancelText: "Discard"
    });

    if (shouldSave) {
      await saveCurrentProject();
    } else {
      hasChanges = false;
    }

    window.location.href = targetUrl;
    return;
  }

  const shouldSave = await showConfirm({
    title: "Save your project?",
    message:
      "You have unsaved changes in this workspace. Save the project before leaving?",
    confirmText: "Save Project",
    cancelText: "Discard"
  });

  if (!shouldSave) {
    hasChanges = false;
    window.location.href = targetUrl;
    return;
  }

  pendingNavigation = targetUrl;

  openNameProjectDialog();
}

const leaveLinks = document.querySelectorAll(
  ".brand, .navigation a:not(.active)"
);

leaveLinks.forEach(link => {
  link.addEventListener("click", event => {
    handleNavigation(event, link.href);
  });
});

window.addEventListener("beforeunload", event => {
  if (hasChanges) {
    event.preventDefault();
    event.returnValue = "";
  }
});

async function loadProject() {
  isLoadingProject = true;

  try {
    workspaceSettings = await getSettings();

    applyWorkspaceSettings();

    const projectId = getProjectIdFromURL();

    if (projectId) {
      currentProject = await getProject(projectId);
    }

    if (currentProject) {
      currentProject.lastOpenedAt = Date.now();

      await saveProject(currentProject);

      projectNameElement.textContent = currentProject.name;

      applyEditorData(currentProject);

      hasChanges = false;

      markSaved();
    } else {
      applyStarterProject();
    }

    buildPreview();
  } catch (error) {
    console.error("Failed to load project:", error);
    markSaveError();
  } finally {
    isLoadingProject = false;
  }
}

loadProject();
registerServiceWorker();
