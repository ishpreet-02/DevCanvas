function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Let the browser begin the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getFiles(projectData = {}) {
  if (
    projectData.files &&
    typeof projectData.files === "object" &&
    Object.keys(projectData.files).length > 0
  ) {
    return { ...projectData.files };
  }

  // Compatibility with projects created before multi-file support.
  return {
    "index.html": projectData.html ?? "",
    "style.css": projectData.css ?? "",
    "script.js": projectData.javascript ?? ""
  };
}

function getMimeType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "html") return "text/html";
  if (extension === "css") return "text/css";
  if (extension === "js") return "text/javascript";

  return "text/plain";
}

export function exportHTML(html) {
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <title>DevCanvas Project</title>
</head>
<body>
${html}
<script src="script.js"></script>
</body>
</html>
  `.trim();

  downloadFile("index.html", fullHTML, "text/html");
}

export function exportCSS(css) {
  downloadFile("style.css", css, "text/css");
}

export function exportJavaScript(javascript) {
  downloadFile("script.js", javascript, "text/javascript");
}

export function exportProjectFiles(projectData = {}) {
  const hasMultipleFiles =
    projectData.files &&
    Object.keys(projectData.files).length > 0;

  // Preserve the previous export behavior for older projects.
  if (!hasMultipleFiles) {
    exportHTML(projectData.html ?? "");
    exportCSS(projectData.css ?? "");
    exportJavaScript(projectData.javascript ?? "");
    return;
  }

  // Multi-file projects are exported using their original names.
  for (const [fileName, content] of Object.entries(projectData.files)) {
    downloadFile(fileName, content, getMimeType(fileName));
  }
}
