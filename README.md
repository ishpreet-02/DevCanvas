# DevCanvas

**DevCanvas** is a browser-based frontend development playground built using HTML, CSS, and Vanilla JavaScript. It allows users to write, run, preview, save, import, and export HTML, CSS, and JavaScript projects directly inside the browser.

The application focuses on demonstrating practical use of modern Browser APIs while providing a lightweight development environment inspired by platforms such as CodePen and JSFiddle.

---

# Project Proposal

## 1. Project Description

DevCanvas is a local-first browser-based development environment designed for creating and testing frontend web projects without requiring a traditional code editor or development setup.

Users can write HTML, CSS, and JavaScript using separate editors and immediately view the generated webpage inside a sandboxed iframe. The application also provides a custom console for displaying JavaScript logs, warnings, errors, and runtime exceptions.

Projects are stored locally inside the browser using IndexedDB, allowing users to close or refresh the browser and continue working on previously saved projects.

DevCanvas also supports importing existing HTML, CSS, and JavaScript files, exporting project files, copying code through the Clipboard API, changing editor preferences, and testing webpages at desktop, tablet, and mobile viewport sizes.

The project is implemented primarily using native browser technologies to demonstrate how modern web applications can provide desktop-like functionality directly inside a browser.

---

# 2. Project Goals

The main goals of DevCanvas are:

- Build a practical browser-based development playground using HTML, CSS, and Vanilla JavaScript.
- Demonstrate meaningful use of multiple Browser APIs.
- Allow HTML, CSS, and JavaScript code to be written and executed directly inside the browser.
- Execute user-generated code in an isolated environment using a sandboxed iframe.
- Provide live output while the user writes code.
- Provide a custom console for displaying JavaScript logs and runtime errors.
- Store projects locally using IndexedDB.
- Allow users to create, save, rename, reopen, and delete projects.
- Support automatic project saving.
- Allow existing frontend files to be imported using the File API.
- Allow project files to be exported using the Blob and URL APIs.
- Provide responsive preview modes for desktop, tablet, and mobile layouts.
- Create a clean, responsive, and professional user interface.
- Keep the application lightweight and usable without requiring a backend for the core version.

---

# 3. Problem Statement

Frontend learners and developers often need a quick environment to test HTML, CSS, and JavaScript code.

Traditional development normally requires:

- Creating multiple project files
- Installing or opening a code editor
- Managing project folders
- Running a development server
- Switching between the editor and browser
- Using browser developer tools separately for debugging

DevCanvas simplifies this workflow by providing the editor, preview, project storage, runtime console, file handling, and responsive testing inside one browser application.

---

# 4. Proposed Solution

DevCanvas provides an integrated frontend development workspace containing:

```text
HTML Editor
     │
CSS Editor
     │
JavaScript Editor
     │
     ▼
Preview Builder
     │
     ▼
Sandboxed iframe
     │
     ├── Rendered Website
     │
     └── JavaScript Console Bridge
                 │
                 ▼
          DevCanvas Console
```

The application combines the HTML, CSS, and JavaScript written by the user and generates a complete document that is rendered inside a sandboxed iframe.

Projects are stored locally using IndexedDB and can later be loaded from the dashboard.

---

# 5. Target Users

DevCanvas is primarily designed for:

- Students learning frontend development
- Beginners experimenting with HTML, CSS, and JavaScript
- Developers testing small frontend ideas
- Teachers demonstrating frontend concepts
- Users who want a lightweight browser-based coding playground

---

# 6. Core Features

## 6.1 HTML, CSS and JavaScript Editors

DevCanvas provides separate editors for:

- HTML
- CSS
- JavaScript

Users can switch between the editors using tabs without leaving the workspace.

---

## 6.2 Sandboxed Code Execution

User-generated code is executed inside a sandboxed iframe.

```html
<iframe sandbox="allow-scripts"></iframe>
```

This keeps the preview environment separated from the main DevCanvas application.

---

## 6.3 Run Functionality

The user can manually execute the current project using the **Run** button.

DevCanvas combines:

```text
HTML
+
CSS
+
JavaScript
```

into a generated HTML document and loads it using:

```javascript
iframe.srcdoc
```

---

## 6.4 Live Preview

DevCanvas automatically refreshes the preview when the user stops typing.

A debounce mechanism is used to prevent unnecessary preview rebuilding on every individual keystroke.

Example flow:

```text
User types
   ↓
Wait approximately 500 ms
   ↓
Generate preview
   ↓
Update iframe
```

Live Preview can also be disabled from Settings.

---

## 6.5 Custom JavaScript Console

DevCanvas provides its own console panel.

It supports:

- `console.log()`
- `console.info()`
- `console.warn()`
- `console.error()`
- Runtime JavaScript errors
- Unhandled Promise rejections

Messages generated inside the sandboxed iframe are transferred to the main application using `postMessage()`.

```text
User JavaScript
      ↓
Sandboxed iframe
      ↓
console.log / error
      ↓
postMessage()
      ↓
DevCanvas Console
```

The console remains hidden until opened by the user and can be cleared, expanded, or closed.

---

## 6.6 Local Project Storage

Projects are stored using **IndexedDB**.

Each saved project contains data similar to:

```javascript
{
  id: "project-id",
  name: "Portfolio Website",
  html: "<h1>Hello</h1>",
  css: "h1 { color: blue; }",
  javascript: "console.log('Hello');",
  createdAt: 0,
  updatedAt: 0,
  lastOpenedAt: 0
}
```

IndexedDB allows projects to remain available after:

- Page refresh
- Browser restart
- Closing and reopening DevCanvas

No authentication is required for the local-first version because browser storage is isolated for each browser profile and origin.

---

## 6.7 Project Management

Users can:

- Create projects
- Name projects
- Save projects
- Rename projects
- Reopen projects
- Delete projects
- View recent projects from the dashboard

An empty workspace does not automatically create a project.

If a user modifies a new temporary workspace and attempts to leave it, DevCanvas asks whether the project should be saved.

---

## 6.8 Autosave

For existing projects, DevCanvas can automatically save changes after the user stops typing.

Example:

```text
Code changed
    ↓
Unsaved Changes
    ↓
Wait
    ↓
Saving...
    ↓
Saved Locally
```

Autosave can be enabled or disabled from Settings.

---

## 6.9 File Import

DevCanvas supports importing:

- `.html`
- `.css`
- `.js`

files using the Browser File API.

```text
Local File
   ↓
File API
   ↓
file.text()
   ↓
DevCanvas Editor
```

The file remains local and does not need to be uploaded to a server.

---

## 6.10 Project Export

Projects can be exported as:

```text
index.html
style.css
script.js
```

The application generates downloadable files using:

- Blob API
- URL API
- Download attribute

The exported `index.html` references the generated CSS and JavaScript files.

---

## 6.11 Clipboard Support

The Clipboard API is used to copy the contents of the currently selected editor.

For example:

```text
HTML Editor
   ↓
Copy
   ↓
System Clipboard
```

The same feature works for CSS and JavaScript.

---

## 6.12 Responsive Preview

DevCanvas provides responsive preview modes:

- Desktop
- Tablet
- Mobile

The iframe container changes width depending on the selected mode.

Example viewport sizes:

```text
Desktop → Available workspace width
Tablet  → 768px
Mobile  → 375px
```

This allows users to test CSS media queries without resizing the entire browser window.

---

## 6.13 Drag-and-Drop File Import

Users can import `.html`, `.css`, and `.js` files by dragging them directly from their local file manager into the workspace.

- A visual drop overlay (`#drag-overlay`) activates automatically when files are dragged over the workspace.
- A drag event counter tracks drag depth across nested child elements to eliminate UI flicker.
- Dropped files are processed using the File API (`file.text()`) and populated into the respective editors.

---

## 6.14 Fullscreen Preview Mode

DevCanvas integrates the **Fullscreen API** to allow developers to inspect and test their projects in a true edge-to-edge environment.

- The fullscreen toggle expands the entire preview panel, retaining access to the responsive mode toggles (Desktop, Tablet, Mobile) and the console trigger.
- Synchronizes with standard browser behavior (e.g., exiting via the `Escape` key) via the `fullscreenchange` event.

---

## 6.15 Smart Tab Indentation

Standard browser `<textarea>` elements shift focus to the next UI control when the `Tab` key is pressed. DevCanvas intercepts the `Tab` key to provide expected code editor behavior:

- Inserts 2 or 4 spaces based on the user's saved preference in Settings.
- Accurately manages cursor selection position (`selectionStart` and `selectionEnd`).
- Dispatches bubbling `input` events to trigger live preview and autosave seamlessly.

---

## 6.16 Page Lifecycle & Autosave Resilience

To eliminate data loss when users switch tabs or close the browser:

- Pending debounced autosaves (1.5s delay) are immediately flushed to IndexedDB on `visibilitychange` (minimizing/tab-switching) and `pagehide` (navigating/closing).
- The `beforeunload` event guards against accidental closure whenever unsaved modifications exist.
- Navigation links prompt users with custom confirmation dialogs before leaving.

---

# 7. Application Pages

DevCanvas uses a multi-page architecture.

```text
DevCanvas/
│
├── index.html
├── workspace.html
└── settings.html
```

## Dashboard

The Dashboard allows users to:

- Create a new project
- Import project files
- View saved projects
- Open saved projects
- Delete projects

## Workspace

The Workspace contains:

- HTML editor
- CSS editor
- JavaScript editor
- Run button
- Save button
- Rename option
- File import
- Project export
- Responsive preview
- Custom console
- Copy functionality

## Settings

The Settings page allows users to configure:

- Editor Theme
- Font Size
- Tab Size
- Autosave
- Live Preview
- Console visibility

Settings are stored using IndexedDB.

---

# 8. Browser APIs Used

| Browser Technology | Purpose |
|---|---|
| IndexedDB API | Store projects and application settings |
| File API | Import HTML, CSS, and JavaScript files |
| Drag and Drop API | Drop HTML, CSS, and JS files directly into workspace |
| Blob API | Generate downloadable project files |
| URL API | Generate temporary object URLs for downloads |
| Clipboard API | Copy code from active editor |
| Fullscreen API | Expand live preview to full display |
| Page Lifecycle API | Flush autosaves on `visibilitychange`/`pagehide` and guard with `beforeunload` |
| Service Worker API | Cache application shell files for offline availability |
| `postMessage()` | Transfer console messages between iframe and parent application |
| iframe `srcdoc` | Render dynamically generated project output |
| iframe Sandbox | Isolate user-generated JavaScript execution |
| History / URL APIs | Maintain project ID in workspace URLs |

---

# 9. Technology Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)

## Browser Technologies

- IndexedDB API
- Service Worker API
- File API & Drag and Drop API
- Blob API & URL API
- Clipboard API
- Fullscreen API
- Page Lifecycle & Beforeunload API
- Sandboxed iframe
- Window Messaging API (`postMessage`)

## Development Tools

- Visual Studio Code
- Git
- GitHub
- Live Server / Local HTTP Server
- Browser Developer Tools

---

# 10. Proposed Project Structure

```text
DevCanvas/
│
├── index.html
├── workspace.html
├── settings.html
│
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   └── components.css
│
├── js/
│   ├── app.js
│   ├── workspace.js
│   ├── database.js
│   ├── projects.js
│   ├── settingsStore.js
│   ├── settingsPage.js
│   ├── files.js
│   ├── export.js
│   ├── ui.js
│   ├── state.js
│   └── serviceWorker.js
│
├── sw.js
├── .gitignore
├── LICENSE
└── README.md
```

---

# 11. System Design

## High-Level Architecture

```text
                    DevCanvas
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Dashboard       Workspace        Settings
        │               │               │
        │          HTML/CSS/JS           │
        │               │               │
        │         Preview Builder        │
        │               │               │
        │        Sandboxed iframe        │
        │          │         │           │
        │          │         │           │
        │       Website    Console       │
        │                     │           │
        └────────────┬────────┴───────────┘
                     │
                 JavaScript
                     │
          ┌──────────┴──────────┐
          │                     │
      IndexedDB             Browser APIs
          │                     │
     Projects/Settings     Files/Blob/
                          Clipboard/etc.
```

---

# 12. Project Data Flow

## Creating a Project

```text
Dashboard
   ↓
Create Project
   ↓
Enter Project Name
   ↓
Create Project Object
   ↓
Store in IndexedDB
   ↓
Open Workspace
```

## Running Code

```text
HTML + CSS + JavaScript
          ↓
    Preview Builder
          ↓
 Generated HTML Document
          ↓
    iframe.srcdoc
          ↓
     Live Output
```

## Saving a Project

```text
Editor Changes
      ↓
Autosave / Save
      ↓
Project Object
      ↓
IndexedDB
      ↓
Saved Locally
```

## Opening a Project

```text
Dashboard Project Card
         ↓
workspace.html?id=project-id
         ↓
Read Project from IndexedDB
         ↓
Restore HTML/CSS/JS
         ↓
Generate Preview
```

---

# 13. Database Design

DevCanvas uses the browser's native IndexedDB database (**`DevCanvasDB`**, Version `3`).

```text
DevCanvasDB (v3)
│
├── projects (keyPath: "id", indexes: "name", "updatedAt", "lastOpenedAt")
│
└── settings (keyPath: "id")
```

Transactions manage connection lifecycles cleanly via `database.close()`, and schema migrations include `onblocked` conflict handling to prevent version locks.

## Projects Store

Key:

```text
id
```

Example:

```javascript
{
  id: "unique-project-id",
  name: "Portfolio Website",
  html: "...",
  css: "...",
  javascript: "...",
  createdAt: 0,
  updatedAt: 0,
  lastOpenedAt: 0
}
```

## Settings Store

Example:

```javascript
{
  id: "app-settings",
  editorTheme: "dark",
  fontSize: 14,
  tabSize: 2,
  autosave: true,
  livePreview: true,
  showConsole: true,
  updatedAt: 0
}
```

---

# 14. Design Considerations

## Local-First Architecture

DevCanvas is designed as a local-first application.

Projects remain inside the user's browser instead of being automatically uploaded to a remote server.

Advantages include:

- Fast project loading
- No account required
- Reduced server dependency
- Better privacy
- Core functionality can work locally

---

## Sandboxed Execution

Executing arbitrary JavaScript directly inside the main application could interfere with DevCanvas itself.

To reduce this risk, user code is executed inside a sandboxed iframe.

```text
DevCanvas Application
        │
        ├── Main UI
        │
        └── Sandboxed Preview
               │
               └── User Code
```

---

## Modular JavaScript Design

DevCanvas separates major responsibilities into JavaScript modules.

For example:

```text
database.js
→ Low-level IndexedDB operations, transaction lifecycle, and connection management

projects.js
→ Project entity creation, sorting, and project storage helpers

settingsStore.js
→ Settings data layer and IndexedDB persistence

settingsPage.js
→ Settings page UI interactions, form controls, and debounced auto-saving

files.js
→ File API import logic and file name parsing

export.js
→ Blob and URL API file generation and download

ui.js
→ Reusable Promise-based confirmation dialogs and toast notifications

state.js
→ Shared in-memory application state

workspace.js
→ Editor tabs, smart tab indentation, live preview, console bridge, drag-and-drop, and page lifecycle management

app.js
→ Dashboard project management, project creation modal, and file import initiation

serviceWorker.js
→ Registers the root Service Worker (sw.js) to enable offline application caching
```

This improves readability, maintainability, and debugging.

---

# 15. Functional Requirements

The application should allow users to:

1. Create a new project.
2. Enter HTML, CSS, and JavaScript code.
3. Switch between code editors.
4. Run code manually.
5. View live output.
6. Display runtime logs and errors.
7. Save projects locally.
8. Reopen saved projects.
9. Rename projects.
10. Delete projects.
11. Import frontend files.
12. Export project files.
13. Copy code to clipboard.
14. Configure editor settings.
15. Test responsive layouts.

---

# 16. Non-Functional Requirements

DevCanvas should provide:

- Responsive interface
- Fast preview updates
- Clean UI
- Persistent local data
- Modular JavaScript architecture
- Safe separation between application UI and user-generated code
- Reasonable browser compatibility
- Easy navigation between pages
- Minimal external dependencies

---

# 17. Current Project Status

The following features have been implemented:

- [x] Multi-page application
- [x] Dashboard
- [x] HTML/CSS/JavaScript editors
- [x] Editor tab switching
- [x] Run functionality
- [x] Sandboxed iframe preview
- [x] Live Preview
- [x] Custom console
- [x] Runtime error handling
- [x] IndexedDB project storage
- [x] Project creation
- [x] Project loading
- [x] Project rename
- [x] Project deletion
- [x] Autosave
- [x] Persistent settings
- [x] File import
- [x] Drag-and-drop file import
- [x] Basic file export
- [x] Clipboard support
- [x] Responsive preview modes
- [x] Fullscreen live preview
- [x] Smart Tab key indentation handling
- [x] Page lifecycle data resilience (`visibilitychange` & `pagehide`)
- [x] Custom accessible confirmation dialogs and toast notifications
- [x] Service Worker offline application caching

---

# 18. Future Enhancements

The following features are planned as future improvements:

- ZIP project export
- Enhanced code editor with syntax highlighting and line numbers (e.g., CodeMirror integration)
- Advanced project templates
- Project duplication
- Search and filtering for saved projects
- Cross-device project access via optional cloud synchronization

---

# 19. Limitations

Current limitations include:

- Projects are stored locally in the browser and are not automatically synchronized between devices.
- Clearing browser site data may remove locally stored projects.
- Authentication and cloud storage are not currently implemented.
- Code editors currently provide basic text editing rather than a full IDE-level editing experience.
- ZIP export and complete offline support are planned for a later version.

---

# 20. Expected Outcome

The final application should provide a lightweight browser-based development environment where users can create, execute, debug, save, import, export, and test frontend projects without requiring a traditional development setup.

The project also demonstrates how Browser APIs can be combined to create a practical application using primarily client-side web technologies.

---

# 21. Similar Platforms

DevCanvas is conceptually inspired by browser-based development platforms such as:

- CodePen
- JSFiddle
- JS Bin

However, DevCanvas is being developed as an educational project focused on understanding and implementing browser-native features such as local database storage, sandboxed execution, file handling, browser messaging, runtime diagnostics, and responsive testing.

---

# 22. Project Scope

The main project scope focuses on:

```text
Code Editing
+
Code Execution
+
Live Preview
+
Runtime Console
+
Local Persistence
+
Project Management
+
File Handling
+
Responsive Testing
```

Advanced features such as cloud synchronization and authentication are outside the current core scope and may be implemented in future versions.

---

# Author

**Ishpreet Singh Bhatia**

B.Tech Computer Science Engineering  
Chitkara University