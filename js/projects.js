import {
  saveProjectRecord,
  getProjectRecord,
  getAllProjectRecords,
  deleteProjectRecord
} from "./database.js";

function generateProjectId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}`;
}

export function createProject(data) {
  const now = Date.now();

  return {
    id: generateProjectId(),
    name: data.name || "Untitled Project",
    html: data.html || "",
    css: data.css || "",
    javascript: data.javascript || "",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  };
}

export async function saveProject(project) {
  project.updatedAt = Date.now();

  return saveProjectRecord(project);
}

export async function getProject(projectId) {
  return getProjectRecord(projectId);
}

export async function getProjects() {
  const projects = await getAllProjectRecords();

  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function removeProject(projectId) {
  return deleteProjectRecord(projectId);
}