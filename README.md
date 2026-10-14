# DevCanvas — Browser-Based Frontend IDE

> **A lightweight, local-first web development playground built with HTML5, CSS3, and Vanilla JavaScript.**

DevCanvas enables developers to create, edit, debug, and preview multi-file web applications directly within the browser—with zero build tools, zero external dependencies, and complete offline capability.

---

# 📋 Project Proposal

## 1. Project Description

### 1.1 Overview
DevCanvas is an educational, client-side integrated development environment (IDE) inspired by platforms like CodePen and JSFiddle. Traditional frontend development workflows often require installing heavy IDEs, configuring build tools, organizing local directories, running local servers, and constantly context-switching between windows. 

DevCanvas eliminates this overhead by bundling a complete code editor, an interactive file explorer, an isolated sandbox runtime, an integrated diagnostic console, and offline storage inside a single browser tab.

### 1.2 Target Audience
- **Students & Beginners**: Learn HTML, CSS, and modern JavaScript without configuration barriers.
- **Instructors**: Demonstrate live code examples, DOM manipulation, and browser APIs during lectures.
- **Frontend Developers**: Rapidly test UI components, CSS experiments, and JavaScript snippets in a clean sandbox.

---

## 2. Project Goals

- **Zero-Dependency Architecture**: Build a complete development playground using only native browser web standards (HTML5, CSS3, ES Modules).
- **Practical Browser API Integration**: Deeply utilize and demonstrate modern Web APIs (IndexedDB, Service Worker, Channel Messaging, File API, Fullscreen, Clipboard).
- **Multi-File Workspace**: Enable full multi-file authoring (`.html`, `.css`, `.js`) with an interactive explorer rather than restricting users to a single fixed file per language.
- **Secure Sandboxed Execution**: Execute untrusted user-generated code in an isolated environment to prevent host context contamination.
- **Reliable Local Persistence**: Ensure projects and user settings persist across browser restarts and tab closures with zero cloud lock-in.
- **Offline First**: Support complete application loading and execution without an active internet connection.

---

## 3. System Specifications

### 3.1 Functional Specifications

| Feature | Specification Details |
|---|---|
| **Multi-File Explorer** | Create, rename, delete, and select `.html`, `.css`, and `.js` files via an interactive sidebar. |
| **Custom Modal UI** | Accessible custom `<dialog>` modals with smart text selection (pre-selecting filename without extension) for adding and renaming files. |
| **Code Editor** | Real-time syntax highlighting, dynamic line numbering, and smart `Tab` indentation (2 or 4 spaces). |
| **Live Sandboxed Preview** | Real-time debounced preview rendered inside `<iframe sandbox="allow-scripts">` using dynamic `srcdoc`. |
| **Asset Inlining Engine** | Automatically parses project HTML to link and inline local CSS `<link>` tags and JS `<script>` tags in document order. |
| **Console Bridge** | Two-way communication capturing `log`, `warn`, `error`, `info`, and uncaught runtime errors from the iframe to an expandable drawer via `postMessage()`. |
| **Responsive Modes** | Viewport testing presets for Desktop (fluid), Tablet (`768px`), Mobile (`375px`), and native edge-to-edge Fullscreen. |
| **Local Persistence** | Local-first storage with automatic debounced saving and Page Lifecycle API safeguards (`visibilitychange`, `pagehide`). |
| **File I/O** | Drag-and-drop file imports, file input picker, and multi-file downloads via Blob & URL APIs. |
| **Offline Caching** | Service Worker using a Network-First strategy with Cache Fallback for complete offline reliability. |

### 3.2 Non-Functional Specifications
- **Performance**: Debounced rendering (500ms) prevents UI lag and unnecessary DOM thrashing while typing.
- **Security**: Strict iframe sandboxing isolates untrusted JavaScript execution from the parent window.
- **Portability**: 100% client-side with zero npm packages or server runtime requirements.
- **Reliability**: Schema-versioned IndexedDB with migration handling prevents version lockouts and data loss.
- **Responsiveness**: Fully responsive layout adapting down to mobile screen viewports.

### 3.3 Browser APIs Implemented

| Web API | Purpose in DevCanvas |
|---|---|
| **IndexedDB API** | Persistent local storage for multi-file project collections and preferences |
| **Service Worker API** | Caches application shell files for offline standalone operation |
| **Channel Messaging (`postMessage`)** | Relays logs and runtime errors between sandbox iframe and parent console |
| **HTML5 Drag and Drop API** | Dragging `.html`, `.css`, and `.js` files directly into workspace |
| **File API** | Asynchronously reads imported files using `file.text()` |
| **Blob & URL APIs** | Generates downloadable binary objects for multi-file project export |
| **Fullscreen API** | Full edge-to-edge preview inspection |
| **Page Lifecycle API** | Flushes pending autosaves on `visibilitychange` and `pagehide` |
| **Clipboard API** | One-click copying of active editor code |

---

## 4. System Design & Architecture

### 4.1 High-Level Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                      DevCanvas Host App                       │
│  ┌─────────────────┐  ┌───────────────────┐  ┌─────────────┐  │
│  │   Dashboard     │  │     Workspace     │  │  Settings   │  │
│  │ (Project List)  │  │ (File Tree/Editor)│  │ (Theme/Tab) │  │
│  └────────┬────────┘  └─────────┬─────────┘  └──────┬──────┘  │
│           │                     │                   │         │
│           └──────────────┬──────┴───────────────────┘         │
│                          ▼                                    │
│                 IndexedDB (DevCanvasDB)                       │
└──────────────────────────┬────────────────────────────────────┘
                           │ Preview Generation
                           ▼
┌───────────────────────────────────────────────────────────────┐
│              Sandboxed <iframe> (allow-scripts)               │
│                                                               │
│   Inlined Styles + HTML Markup + Inlined Scripts (in order)   │
│                                                               │
│                 ┌───────────────────────────┐                 │
│                 │   Console Bridge Script   │                 │
│                 └─────────────┬─────────────┘                 │
└───────────────────────────────┼───────────────────────────────┘
                                │ window.parent.postMessage()
                                ▼
              DevCanvas Custom Diagnostic Console
```

### 4.2 Database Design (`DevCanvasDB` v3)

DevCanvas uses the browser's native IndexedDB database with two object stores:

```text
DevCanvasDB (Version 3)
│
├── projects (keyPath: "id")
│   ├── Indexes: "name", "updatedAt", "lastOpenedAt"
│   └── Record Schema:
│       {
│         id: "unique-uuid",
│         name: "Project Name",
│         files: {
│           "index.html": "<!DOCTYPE html>...",
│           "style.css": "body { ... }",
│           "script.js": "console.log(...);"
│         },
│         html: "...",           // Legacy fallback
│         css: "...",            // Legacy fallback
│         javascript: "...",     // Legacy fallback
│         createdAt: 1712000000,
│         updatedAt: 1712000000,
│         lastOpenedAt: 1712000000
│       }
│
└── settings (keyPath: "id")
    └── Record Schema:
        {
          id: "app-settings",
          editorTheme: "dark" | "light",
          fontSize: 13,
          tabSize: 2,
          autosave: true,
          livePreview: true,
          showConsole: true,
          updatedAt: 1712000000
        }
```

### 4.3 Directory Structure

```text
DevCanvas/
├── index.html              # Dashboard page
├── workspace.html          # Main workspace (File tree, editor, preview, console)
├── settings.html           # Settings configuration page
├── sw.js                   # Root service worker for offline caching
│
├── css/
│   ├── variables.css       # Theme tokens and color palette
│   ├── base.css            # Base resets and typography
│   ├── layout.css          # Grid systems, file explorer and responsive rules
│   └── components.css      # Custom dialogs, buttons, editor, syntax highlighter
│
└── js/
    ├── app.js              # Dashboard logic and project creation
    ├── workspace.js        # Main IDE engine, file manager, preview builder
    ├── database.js         # IndexedDB operations and schema migrations
    ├── projects.js         # Project entity normalization and persistence helpers
    ├── files.js            # File API import and duplicate checking
    ├── export.js           # Multi-file exporter using Blob and URL APIs
    ├── settingsStore.js    # Settings storage layer
    ├── settingsPage.js     # Settings UI event handling
    ├── ui.js               # Reusable confirmation dialogs and toasts
    └── serviceWorker.js    # Service worker registration helper
```

---

## 5. Getting Started

DevCanvas runs directly in the browser with **no build steps or npm installations**:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/DevCanvas.git
   cd DevCanvas
   ```

2. **Serve with a local static HTTP server** (required for ES Modules and Service Workers):
   - **VS Code Live Server**: Right-click `index.html` → *Open with Live Server*
   - **Python**: `python -m http.server 5500`
   - **Node.js**: `npx serve .`

3. Open `http://localhost:5500` in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari.

---

## 6. Author

**Ishpreet Singh Bhatia**  
B.Tech Computer Science Engineering  
Chitkara University
