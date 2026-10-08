import {
  getSettings,
  saveSettings
} from "./settingsStore.js";

const editorThemeSelect = document.getElementById(
  "editor-theme"
);

const fontSizeSelect = document.getElementById(
  "font-size"
);

const tabSizeSelect = document.getElementById(
  "tab-size"
);

const autosaveToggle = document.getElementById(
  "autosave-setting"
);

const livePreviewToggle = document.getElementById(
  "live-preview-setting"
);

const showConsoleToggle = document.getElementById(
  "show-console-setting"
);

const settingsSaveDot = document.getElementById(
  "settings-save-dot"
);

const settingsSaveText = document.getElementById(
  "settings-save-text"
);

let currentSettings = null;
let saveTimer;

function setStatus(type, text) {
  if (settingsSaveDot) {
    settingsSaveDot.className =
      `settings-save-dot ${type}`.trim();
  }

  if (settingsSaveText) {
    settingsSaveText.textContent = text;
  }
}

function displaySettings(settings) {
  editorThemeSelect.value =
    settings.editorTheme;

  fontSizeSelect.value =
    String(settings.fontSize);

  tabSizeSelect.value =
    String(settings.tabSize);

  autosaveToggle.checked =
    settings.autosave;

  livePreviewToggle.checked =
    settings.livePreview;

  showConsoleToggle.checked =
    settings.showConsole;
}

function readSettingsForm() {
  return {
    editorTheme:
      editorThemeSelect.value,

    fontSize:
      Number(fontSizeSelect.value),

    tabSize:
      Number(tabSizeSelect.value),

    autosave:
      autosaveToggle.checked,

    livePreview:
      livePreviewToggle.checked,

    showConsole:
      showConsoleToggle.checked
  };
}

async function saveCurrentSettings() {
  try {
    setStatus(
      "saving",
      "Saving..."
    );

    currentSettings = await saveSettings({
      ...currentSettings,
      ...readSettingsForm()
    });

    setStatus(
      "saved",
      "Settings saved"
    );
  } catch (error) {
    console.error(
      "Failed to save settings:",
      error
    );

    setStatus(
      "error",
      "Unable to save settings"
    );
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);

  setStatus(
    "saving",
    "Saving..."
  );

  saveTimer = setTimeout(() => {
    saveCurrentSettings();
  }, 400);
}

async function initializeSettingsPage() {
  try {
    setStatus(
      "",
      "Loading settings..."
    );

    currentSettings =
      await getSettings();

    displaySettings(
      currentSettings
    );

    setStatus(
      "saved",
      "Settings saved"
    );

    const controls = [
      editorThemeSelect,
      fontSizeSelect,
      tabSizeSelect,
      autosaveToggle,
      livePreviewToggle,
      showConsoleToggle
    ];

    controls.forEach(control => {
      control.addEventListener(
        "change",
        scheduleSave
      );
    });
  } catch (error) {
    console.error(
      "Failed to initialize settings:",
      error
    );

    setStatus(
      "error",
      "Unable to load settings"
    );
  }
}

initializeSettingsPage();

