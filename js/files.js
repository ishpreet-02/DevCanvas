const supportedExtensions = ["html", "css", "js"];

function getFileExtension(fileName) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export async function readProjectFiles(fileList) {
  const files = Array.from(fileList);

  if (files.length === 0) {
    throw new Error("No files selected.");
  }

  const projectData = {
    html: null,
    css: null,
    javascript: null,
    files: {}
  };

  const importedFiles = [];

  for (const file of files) {
    const extension = getFileExtension(file.name);

    if (!supportedExtensions.includes(extension)) {
      continue;
    }

    if (projectData.files[file.name] !== undefined) {
      throw new Error(`Duplicate file name: ${file.name}`);
    }

    const content = await file.text();

    // Preserve every imported file, including multiple files
    // with the same extension.
    projectData.files[file.name] = content;

    importedFiles.push({
      name: file.name,
      extension
    });

    // Keep compatibility with the existing three-editor workspace.
    if (extension === "html" && projectData.html === null) {
      projectData.html = content;
    }

    if (extension === "css" && projectData.css === null) {
      projectData.css = content;
    }

    if (extension === "js" && projectData.javascript === null) {
      projectData.javascript = content;
    }
  }

  if (importedFiles.length === 0) {
    throw new Error("Please select HTML, CSS or JavaScript files.");
  }

  return {
    projectData,
    importedFiles
  };
}

export function createImportedProjectName(fileList) {
  const files = Array.from(fileList);

  const htmlFile = files.find(file => {
    return getFileExtension(file.name) === "html";
  });

  const selectedFile = htmlFile || files[0];

  if (!selectedFile) {
    return "Imported Project";
  }

  return (
    selectedFile.name.replace(/\.[^/.]+$/, "") ||
    "Imported Project"
  );
}