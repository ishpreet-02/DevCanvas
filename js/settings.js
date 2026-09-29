import {
  saveSettingsRecord,
  getSettingsRecord
} from "./database.js";

const SETTINGS_ID = "app-settings";

export const defaultSettings = {
  id: SETTINGS_ID,
  editorTheme: "dark",
  fontSize: 14,
  tabSize: 2,
  autosave: true,
  livePreview: true,
  showConsole: true,
  updatedAt: Date.now()
};

export async function getSettings() {
  const savedSettings = await getSettingsRecord(SETTINGS_ID);

  if (!savedSettings) {
    await saveSettings(defaultSettings);

    return { ...defaultSettings };
  }

  return {
    ...defaultSettings,
    ...savedSettings
  };
}

export async function saveSettings(settings) {
  const updatedSettings = {
    ...defaultSettings,
    ...settings,
    id: SETTINGS_ID,
    updatedAt: Date.now()
  };

  await saveSettingsRecord(updatedSettings);

  return updatedSettings;
}

const editorThemeSelect = document.getElementById("editor-theme");
const fontSizeSelect = document.getElementById("font-size");
const tabSizeSelect = document.getElementById("tab-size");

const autosaveToggle = document.getElementById("autosave-setting");
const livePreviewToggle = document.getElementById("live-preview-setting");
const showConsoleToggle = document.getElementById("show-console-setting");

const settingsSaveDot = document.getElementById("settings-save-dot");
const settingsSaveText = document.getElementById("settings-save-text");

let currentSettings = null;
let settingsTimer;

function isSettingsPage() {
  return Boolean(editorThemeSelect);
}

function setSettingsStatus(type, text) {
  if (!settingsSaveDot || !settingsSaveText) {
    return;
  }

  settingsSaveDot.className = `settings-save-dot ${type}`;
  settingsSaveText.textContent = text;
}

function displaySettings(settings) {
  editorThemeSelect.value = settings.editorTheme;
  fontSizeSelect.value = String(settings.fontSize);
  tabSizeSelect.value = String(settings.tabSize);

  autosaveToggle.checked = settings.autosave;
  livePreviewToggle.checked = settings.livePreview;
  showConsoleToggle.checked = settings.showConsole;
}

function readSettingsForm() {
  return {
    editorTheme: editorThemeSelect.value,
    fontSize: Number(fontSizeSelect.value),
    tabSize: Number(tabSizeSelect.value),
    autosave: autosaveToggle.checked,
    livePreview: livePreviewToggle.checked,
    showConsole: showConsoleToggle.checked
  };
}

async function saveSettingsFromPage() {
  try {
    setSettingsStatus("saving", "Saving...");

    currentSettings = await saveSettings({
      ...currentSettings,
      ...readSettingsForm()
    });

    setSettingsStatus("saved", "Settings saved");
  } catch (error) {
    console.error("Failed to save settings:", error);

    setSettingsStatus("error", "Unable to save settings");
  }
}

function scheduleSettingsSave() {
  clearTimeout(settingsTimer);

  setSettingsStatus("saving", "Saving...");

  settingsTimer = setTimeout(() => {
    saveSettingsFromPage();
  }, 400);
}

async function initializeSettingsPage() {
  if (!isSettingsPage()) {
    return;
  }

  try {
    currentSettings = await getSettings();

    displaySettings(currentSettings);

    setSettingsStatus("saved", "Settings saved");

    const controls = [
      editorThemeSelect,
      fontSizeSelect,
      tabSizeSelect,
      autosaveToggle,
      livePreviewToggle,
      showConsoleToggle
    ];

    controls.forEach(control => {
      control.addEventListener("change", scheduleSettingsSave);
    });
  } catch (error) {
    console.error("Failed to load settings:", error);

    setSettingsStatus("error", "Unable to load settings");
  }
}

initializeSettingsPage();