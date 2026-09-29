import {
  createProject,
  saveProject,
  getProjects,
  removeProject
} from "./projects.js";

const projectGrid = document.getElementById("project-grid");

const newProjectDialog = document.getElementById("new-project-dialog");
const newProjectForm = document.getElementById("new-project-form");
const newProjectName = document.getElementById("new-project-name");
const cancelProjectButton = document.getElementById("cancel-project-button");

function openWorkspace(projectId) {
  window.location.href = `./workspace.html?id=${projectId}`;
}

function openNewProjectDialog() {
  newProjectName.value = "";
  newProjectDialog.showModal();

  setTimeout(() => {
    newProjectName.focus();
  }, 0);
}

function closeNewProjectDialog() {
  newProjectDialog.close();
}

function setupProjectButtons() {
  const newProjectButton = document.getElementById("new-project-button");
  const heroNewProjectButton = document.getElementById("hero-new-project-button");
  const createProjectCard = document.getElementById("create-project-card");

  newProjectButton?.addEventListener("click", openNewProjectDialog);
  heroNewProjectButton?.addEventListener("click", openNewProjectDialog);
  createProjectCard?.addEventListener("click", openNewProjectDialog);

  cancelProjectButton?.addEventListener("click", closeNewProjectDialog);
}

newProjectForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const name = newProjectName.value.trim();

  if (!name) {
    newProjectName.focus();
    return;
  }

  try {
    const project = createProject({
      name,
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

    closeNewProjectDialog();
    openWorkspace(project.id);
  } catch (error) {
    console.error("Failed to create project:", error);
  }
});

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(value) {
  const element = document.createElement("div");

  element.textContent = value;

  return element.innerHTML;
}

function createProjectCard(project) {
  const article = document.createElement("article");

  article.className = "project-card";

  article.innerHTML = `
    <div class="project-thumbnail portfolio-thumb">
      <div class="thumb-content">
        <span>DevCanvas</span>
        <strong>${escapeHTML(project.name)}</strong>
      </div>
    </div>

    <div class="project-card-body">
      <div class="project-title-row">
        <h3>${escapeHTML(project.name)}</h3>

        <button
          class="icon-button delete-project-button"
          data-project-id="${project.id}"
          aria-label="Delete project">
          ×
        </button>
      </div>

      <p class="project-tech">
        HTML · CSS · JavaScript
      </p>

      <div class="project-date">
        <span>▣</span>
        Updated ${formatDate(project.updatedAt)}
      </div>
    </div>
  `;

  article.addEventListener("click", event => {
    if (event.target.closest(".delete-project-button")) {
      return;
    }

    openWorkspace(project.id);
  });

  const deleteButton = article.querySelector(".delete-project-button");

  deleteButton.addEventListener("click", async event => {
    event.stopPropagation();

    const confirmed = window.confirm(`Delete "${project.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await removeProject(project.id);
      article.remove();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  });

  return article;
}

async function loadProjects() {
  if (!projectGrid) {
    return;
  }

  try {
    const projects = await getProjects();
    const createCard = document.getElementById("create-project-card");

    projects.forEach(project => {
      projectGrid.insertBefore(createProjectCard(project), createCard);
    });
  } catch (error) {
    console.error("Failed to load projects:", error);
  }
}

function initializeApp() {
  setupProjectButtons();
  loadProjects();
}

initializeApp();