export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "Service Worker is not supported in this browser."
    );

    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register("./sw.js");

      console.log(
        "DevCanvas Service Worker registered:",
        registration.scope
      );
    } catch (error) {
      console.error(
        "Service Worker registration failed:",
        error
      );
    }
  });
}

