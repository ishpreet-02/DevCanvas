import {
  createProject,
  saveProject,
  getProject
} from "./projects.js";

const tabs = document.querySelectorAll(".editor-tab");
const editors = document.querySelectorAll(".code-editor");

const htmlEditor = document.getElementById("html-editor");
const cssEditor = document.getElementById("css-editor");
const javascriptEditor = document.getElementById("javascript-editor");

const runButton = document.getElementById("run-button");
const saveButton = document.getElementById("save-button");
const renameButton = document.getElementById("rename-button");

const previewFrame = document.getElementById("preview-frame");

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

let previewTimer;
let autosaveTimer;
let consoleMessages = 0;
let currentProject = null;
let isLoadingProject = false;

const AUTOSAVE_DELAY = 1500;
const PREVIEW_DELAY = 500;

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);

  return params.get("id");
}

function switchEditor(editorName) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.editor === editorName);
  });

  editors.forEach(editor => {
    editor.classList.remove("active");
  });

  document.getElementById(`${editorName}-editor`).classList.add("active");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchEditor(tab.dataset.editor);
  });
});

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
    openConsole();
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
            message: "Unhandled Promise Rejection: " + serialize(event.reason)
          }, "*");
        });
      })();
    <\/script>
  `;
}

function buildPreview() {
  clearConsole();

  const html = htmlEditor.value;
  const css = cssEditor.value;

  const javascript = javascriptEditor.value.replace(
    /<\/script/gi,
    "<\\/script"
  );

  const documentContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <style>
        ${css}
      </style>
    </head>

    <body>
      ${html}

      ${createConsoleBridge()}

      <script>
        ${javascript}
      <\/script>
    </body>
    </html>
  `;

  previewFrame.srcdoc = documentContent;
}

function schedulePreview() {
  clearTimeout(previewTimer);

  previewTimer = setTimeout(() => {
    buildPreview();
  }, PREVIEW_DELAY);
}

function getEditorData() {
  return {
    html: htmlEditor.value,
    css: cssEditor.value,
    javascript: javascriptEditor.value
  };
}

function applyEditorData(project) {
  htmlEditor.value = project.html;
  cssEditor.value = project.css;
  javascriptEditor.value = project.javascript;
}

function updateProjectURL(projectId) {
  const url = new URL(window.location.href);

  url.searchParams.set("id", projectId);

  window.history.replaceState({}, "", url);
}

async function saveCurrentProject() {
  if (!currentProject) {
    return;
  }

  try {
    markSaving();

    const editorData = getEditorData();

    currentProject.html = editorData.html;
    currentProject.css = editorData.css;
    currentProject.javascript = editorData.javascript;

    await saveProject(currentProject);

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

editors.forEach(editor => {
  editor.addEventListener("input", () => {
    schedulePreview();
    scheduleAutosave();
  });
});

runButton.addEventListener("click", () => {
  clearTimeout(previewTimer);

  buildPreview();
});

saveButton.addEventListener("click", async () => {
  clearTimeout(autosaveTimer);

  await saveCurrentProject();
});

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
    return;
  }

  renameProjectName.value = currentProject.name;

  renameDialog.showModal();

  setTimeout(() => {
    renameProjectName.focus();
    renameProjectName.select();
  }, 0);
}

function closeRenameDialog() {
  renameDialog.close();
}

renameButton.addEventListener("click", openRenameDialog);
cancelRenameButton.addEventListener("click", closeRenameDialog);

renameForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentProject) {
    return;
  }

  const newName = renameProjectName.value.trim();

  if (!newName) {
    renameProjectName.focus();
    return;
  }

  try {
    currentProject.name = newName;

    await saveProject(currentProject);

    projectNameElement.textContent = newName;

    markSaved();
    closeRenameDialog();
  } catch (error) {
    console.error("Failed to rename project:", error);

    markSaveError();
  }
});

async function createFallbackProject() {
  const project = createProject({
    name: "Untitled Project",
    html: "<h1>Hello DevCanvas</h1>\n<p>Start building your project.</p>",
    css: `body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px;
}

h1 {
  color: #4f7cff;
}`,
    javascript: 'console.log("DevCanvas project started");'
  });

  await saveProject(project);

  updateProjectURL(project.id);

  return project;
}

async function loadProject() {
  isLoadingProject = true;

  try {
    const projectId = getProjectIdFromURL();

    if (projectId) {
      currentProject = await getProject(projectId);
    }

    if (!currentProject) {
      currentProject = await createFallbackProject();
    }

    currentProject.lastOpenedAt = Date.now();

    await saveProject(currentProject);

    projectNameElement.textContent = currentProject.name;

    applyEditorData(currentProject);

    markSaved();

    buildPreview();
  } catch (error) {
    console.error("Failed to load project:", error);

    markSaveError();
  } finally {
    isLoadingProject = false;
  }
}

loadProject();