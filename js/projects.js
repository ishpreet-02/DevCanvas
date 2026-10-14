import {
  saveProjectRecord,
  getProjectRecord,
  getAllProjectRecords,
  deleteProjectRecord
} from "./database.js";

const DEFAULT_HTML_FILE = "index.html";
const DEFAULT_CSS_FILE = "style.css";
const DEFAULT_JS_FILE = "script.js";

function generateProjectId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSupportedFileName(fileName) {
  return (
    typeof fileName === "string" &&
    !fileName.includes("/") &&
    !fileName.includes("\\") &&
    /\.(html|css|js)$/i.test(fileName)
  );
}

export function normalizeProjectFiles(files, legacyData = {}) {
  const normalized = {};

  if (files && typeof files === "object") {
    for (const [fileName, content] of Object.entries(files)) {
      if (
        isSupportedFileName(fileName) &&
        typeof content === "string"
      ) {
        normalized[fileName] = content;
      }
    }
  }

  // Migrate projects saved before multi-file support existed.
  if (Object.keys(normalized).length === 0) {
    normalized[DEFAULT_HTML_FILE] = legacyData.html ?? "";
    normalized[DEFAULT_CSS_FILE] = legacyData.css ?? "";
    normalized[DEFAULT_JS_FILE] = legacyData.javascript ?? "";
  }

  return normalized;
}

function getFileByExtension(files, extension, preferredName, fallback = "") {
  if (typeof files[preferredName] === "string") {
    return files[preferredName];
  }

  const matchingName = Object.keys(files).find(name => {
    return name.toLowerCase().endsWith(`.${extension}`);
  });

  return matchingName ? files[matchingName] : fallback;
}

function synchronizeLegacyFields(project) {
  project.files = normalizeProjectFiles(project.files, project);

  // Keep these fields so older parts of DevCanvas still work.
  project.html = getFileByExtension(
    project.files,
    "html",
    DEFAULT_HTML_FILE,
    project.html ?? ""
  );

  project.css = getFileByExtension(
    project.files,
    "css",
    DEFAULT_CSS_FILE,
    project.css ?? ""
  );

  project.javascript = getFileByExtension(
    project.files,
    "js",
    DEFAULT_JS_FILE,
    project.javascript ?? ""
  );

  return project;
}

export function createProject(data = {}) {
  const now = Date.now();

  const hasFileCollection =
    data.files &&
    typeof data.files === "object" &&
    Object.keys(data.files).length > 0;

  const files = hasFileCollection
    ? normalizeProjectFiles(data.files, data)
    : {
        [DEFAULT_HTML_FILE]: data.html ?? "",
        [DEFAULT_CSS_FILE]: data.css ?? "",
        [DEFAULT_JS_FILE]: data.javascript ?? ""
      };

  const project = {
    id: generateProjectId(),
    name: data.name || "Untitled Project",
    files,
    html: "",
    css: "",
    javascript: "",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  };

  return synchronizeLegacyFields(project);
}

export async function saveProject(project) {
  synchronizeLegacyFields(project);
  project.updatedAt = Date.now();

  return saveProjectRecord(project);
}

export async function getProject(projectId) {
  const project = await getProjectRecord(projectId);

  if (!project) {
    return null;
  }

  // Older saved projects gain a files collection when opened and saved.
  return synchronizeLegacyFields(project);
}

export async function getProjects() {
  const projects = await getAllProjectRecords();

  return projects
    .map(project => synchronizeLegacyFields(project))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function removeProject(projectId) {
  return deleteProjectRecord(projectId);
}