import { renderRoute } from "./router.js";

function initializeApp() {
  console.log("DevCanvas initialized");

  if (!window.location.hash) {
    window.location.hash = "dashboard";
  } else {
    renderRoute();
  }

  window.addEventListener("hashchange", renderRoute);
  setupNewProjectButton();
}

function setupNewProjectButton() {
  const button = document.getElementById("new-project-button");

  button.addEventListener("click", () => {
    window.location.hash = "workspace";
  });
}

initializeApp();