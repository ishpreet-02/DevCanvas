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

const importFilesButton = document.getElementById("import-files-button");
const exportProjectButton = document.getElementById("export-project-button");
const copyCodeButton = document.getElementById("copy-code-button");
const workspaceFileInput = document.getElementById("workspace-file-input");

let previewTimer;
let autosaveTimer;
let consoleMessages = 0;

let currentProject = null;
let workspaceSettings = null;

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
    editor.style.fontSize = `${workspaceSettings.fontSize}px`;
    editor.style.tabSize = workspaceSettings.tabSize;

    editor.classList.toggle(
      "editor-theme-light",
      workspaceSettings.editorTheme === "light"
    );
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
}

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

function importFilesIntoEditors(projectData) {
  if (projectData.html !== null) {
    htmlEditor.value = projectData.html;
  }

  if (projectData.css !== null) {
    cssEditor.value = projectData.css;
  }

  if (projectData.javascript !== null) {
    javascriptEditor.value = projectData.javascript;
  }

  hasChanges = true;

  markUnsaved();

  buildPreview();

  if (currentProject && workspaceSettings?.autosave) {
    scheduleAutosave();
  }
}

function openWorkspaceFilePicker() {
  workspaceFileInput.click();
}

function applyStarterProject() {
  htmlEditor.value = starterProject.html;
  cssEditor.value = starterProject.css;
  javascriptEditor.value = starterProject.javascript;

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
