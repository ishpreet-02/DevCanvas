import { state } from "./state.js";

const routes = {
  dashboard: {
  title: "Projects",
  description: "Create and manage your browser-based web projects.",

  render() {
    return `
      <div class="page-heading">
        <h3>Recent Projects</h3>
        <p>Your latest DevCanvas projects will appear here.</p>
      </div>

      <div class="card-grid">
        <article class="card">
          <h4>Portfolio Website</h4>
          <p>HTML · CSS · JavaScript</p>
          <p>Last edited 2 hours ago</p>
        </article>

        <article class="card">
          <h4>Landing Page</h4>
          <p>HTML · CSS · JavaScript</p>
          <p>Last edited yesterday</p>
        </article>

        <article class="card">
          <h4>Calculator</h4>
          <p>HTML · CSS · JavaScript</p>
          <p>Last edited 3 days ago</p>
        </article>

        <article class="card">
          <h4>Create New Project</h4>
          <p>Start with a blank HTML, CSS and JavaScript workspace.</p>
        </article>
      </div>
    `;
  }
},
  workspace: {
  title: "Untitled Project",
  description: "Write, run and preview your frontend code.",

  render() {
    return `
      <div class="workspace">
        <section class="editor-panel">
          <div class="panel-header">
            <div class="editor-tabs">
              <button class="editor-tab active">HTML</button>
              <button class="editor-tab">CSS</button>
              <button class="editor-tab">JavaScript</button>
            </div>
            <span>Editor</span>
          </div>

          <div class="editor-placeholder">
&lt;h1&gt;Hello DevCanvas&lt;/h1&gt;
&lt;p&gt;Start building something.&lt;/p&gt;
          </div>
        </section>

        <section class="preview-panel">
          <div class="panel-header">
            <span>Preview</span>
            <span>Desktop</span>
          </div>

          <div class="preview-placeholder">
            Your live preview will appear here.
          </div>
        </section>
      </div>
    `;
  }
},
  
  settings: {
    title: "Settings",
    description: "Configure your DevCanvas environment.",
    render() {
      return `
        <div class="page-heading">
          <h3>Settings</h3>
          <p>Configure your editor and development environment.</p>
        </div>
        <div class="card">
          <h4>Coming Next</h4>
          <p>Theme, autosave, live preview, editor font size and other preferences will be available here.</p>
        </div>
      `;
    }
  }
};


export function renderRoute() {
  let routeName = window.location.hash.replace("#", "");
  if (!routes[routeName]) routeName = "dashboard";

  state.currentRoute = routeName;
  const route = routes[routeName];

  document.getElementById("page-title").textContent = route.title;
  document.getElementById("page-description").textContent = route.description;
  document.getElementById("view-container").innerHTML = route.render();

  updateNavigation(routeName);
}

function updateNavigation(currentRoute) {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.route === currentRoute);
  });
}