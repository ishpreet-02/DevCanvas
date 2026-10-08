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
  const savedSettings = await getSettingsRecord(
    SETTINGS_ID
  );

  if (!savedSettings) {
    const initialSettings = {
      ...defaultSettings,
      updatedAt: Date.now()
    };

    await saveSettingsRecord(initialSettings);

    return initialSettings;
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

