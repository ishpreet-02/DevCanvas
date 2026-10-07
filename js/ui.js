export function createUIHelpers() {
  const confirmDialog = document.getElementById("confirm-dialog");
  const confirmTitle = document.getElementById("confirm-dialog-title");
  const confirmMessage = document.getElementById("confirm-dialog-message");
  const confirmActionButton = document.getElementById("confirm-action-button");
  const confirmCancelButton = document.getElementById("confirm-cancel-button");
  const toastContainer = document.getElementById("toast-container");

  function showConfirm({
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "normal"
  }) {
    if (!confirmDialog) {
      return Promise.resolve(false);
    }

    return new Promise(resolve => {
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmActionButton.textContent = confirmText;
      confirmCancelButton.textContent = cancelText;
      confirmDialog.classList.toggle("danger", type === "danger");

      function cleanup() {
        confirmActionButton.removeEventListener("click", handleConfirm);
        confirmCancelButton.removeEventListener("click", handleCancel);
        confirmDialog.removeEventListener("cancel", handleCancel);
      }

      function handleConfirm() {
        cleanup();
        confirmDialog.close();
        resolve(true);
      }

      function handleCancel() {
        cleanup();
        confirmDialog.close();
        resolve(false);
      }

      confirmActionButton.addEventListener("click", handleConfirm);
      confirmCancelButton.addEventListener("click", handleCancel);
      confirmDialog.addEventListener("cancel", handleCancel);
      confirmDialog.showModal();
    });
  }

  function showToast(message, type = "info", duration = 2600) {
    if (!toastContainer) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const messageElement = document.createElement("span");
    messageElement.className = "toast-message";
    messageElement.textContent = message;
    toast.appendChild(messageElement);
    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
  }

  return { showConfirm, showToast };
}
