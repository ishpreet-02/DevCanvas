function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
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

  downloadFile(
    "index.html",
    fullHTML,
    "text/html"
  );
}

export function exportCSS(css) {
  downloadFile(
    "style.css",
    css,
    "text/css"
  );
}

export function exportJavaScript(javascript) {
  downloadFile(
    "script.js",
    javascript,
    "text/javascript"
  );
}

export function exportProjectFiles(projectData) {
  exportHTML(projectData.html);
  exportCSS(projectData.css);
  exportJavaScript(projectData.javascript);
}
