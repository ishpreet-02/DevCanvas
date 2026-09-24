const tabs = document.querySelectorAll(".editor-tab");
const editors = document.querySelectorAll(".code-editor");

const htmlEditor = document.getElementById("html-editor");
const cssEditor = document.getElementById("css-editor");
const javascriptEditor = document.getElementById("javascript-editor");

const runButton = document.getElementById("run-button");
const previewFrame = document.getElementById("preview-frame");

let previewTimer;

function switchEditor(editorName) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.editor === editorName);
  });

  editors.forEach(editor => {
    editor.classList.remove("active");
  });

  document.getElementById(`${editorName}-editor`).classList.add("active");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    switchEditor(tab.dataset.editor);
  });
});

function buildPreview() {
  const html = htmlEditor.value;
  const css = cssEditor.value;

  const javascript = javascriptEditor.value.replace(
    /<\/script/gi,
    "<\\/script"
  );

  const documentContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <style>
        ${css}
      </style>
    </head>

    <body>
      ${html}

      <script>
        ${javascript}
      <\/script>
    </body>
    </html>
  `;

  previewFrame.srcdoc = documentContent;
}

function schedulePreview() {
  clearTimeout(previewTimer);

  previewTimer = setTimeout(() => {
    buildPreview();
  }, 500);
}

editors.forEach(editor => {
  editor.addEventListener("input", schedulePreview);
});

runButton.addEventListener("click", () => {
  clearTimeout(previewTimer);
  buildPreview();
});

buildPreview();