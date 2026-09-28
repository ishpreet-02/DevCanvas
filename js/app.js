import {
  getProjects,
  removeProject
} from "./projects.js";

const projectGrid = document.getElementById("project-grid");

function openWorkspace(projectId = null) {
  if (projectId) {
    window.location.href = `./workspace.html?id=${projectId}`;
    return;
  }

  window.location.href = "./workspace.html";
}

function setupProjectButtons() {
  const newProjectButton = document.getElementById("new-project-button");
  const heroNewProjectButton = document.getElementById("hero-new-project-button");
  const createProjectCard = document.getElementById("create-project-card");

  if (newProjectButton) {
    newProjectButton.addEventListener("click", () => {
      openWorkspace();
    });
  }

  if (heroNewProjectButton) {
    heroNewProjectButton.addEventListener("click", () => {
      openWorkspace();
    });
  }

  if (createProjectCard) {
    createProjectCard.addEventListener("click", () => {
      openWorkspace();
    });
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
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

    const confirmed = window.confirm(
      `Delete "${project.name}"?`
    );

    if (!confirmed) {
      return;
    }

    await removeProject(project.id);

    article.remove();
  });

  return article;
}

function escapeHTML(value) {
  const element = document.createElement("div");

  element.textContent = value;

  return element.innerHTML;
}

async function loadProjects() {
  if (!projectGrid) {
    return;
  }

  try {
    const projects = await getProjects();

    const createCard = document.getElementById("create-project-card");

    projects.forEach(project => {
      const card = createProjectCard(project);

      projectGrid.insertBefore(card, createCard);
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