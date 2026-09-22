function initializeApp() {
  setupProjectButtons();
}

function setupProjectButtons() {
  const newProjectButton = document.getElementById("new-project-button");
  const heroNewProjectButton = document.getElementById("hero-new-project-button");
  const createProjectCard = document.getElementById("create-project-card");

  const openWorkspace = () => {
    window.location.href = "./workspace.html";
  };

  if (newProjectButton) {
    newProjectButton.addEventListener("click", openWorkspace);
  }

  if (heroNewProjectButton) {
    heroNewProjectButton.addEventListener("click", openWorkspace);
  }

  if (createProjectCard) {
    createProjectCard.addEventListener("click", openWorkspace);
  }
}

initializeApp();