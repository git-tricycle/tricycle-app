/**
 * PWA Initialization Script
 * This ensures the manifest.json is properly linked and PWA installation prompt works
 * Works in both development (localhost) and production environments
 */

export function initPWA() {
  // Only run on web platform
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isDev = isLocalhost || window.location.hostname.includes("dev");

  // Step 1: Ensure manifest.json is linked in the head
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (!existingManifest) {
    console.log("📋 Adding manifest.json link to head");
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);
  } else {
    console.log("📋 Manifest link already exists");
  }

  // Step 2: Verify manifest is loading
  fetch("/manifest.json")
    .then((response) => {
      if (response.ok) {
        console.log("✅ manifest.json is accessible and valid");
      } else {
        console.error("❌ manifest.json returned status:", response.status);
      }
    })
    .catch((error) => {
      console.error("❌ Failed to fetch manifest.json:", error);
    });

  // Step 3: Listen for beforeinstallprompt (works on all browsers/environments)
  window.addEventListener(
    "beforeinstallprompt",
    (e) => {
      console.log("🎯 Native beforeinstallprompt event detected!");
      // The event will be stored globally in usePWA hook
    },
    { once: false }
  );

  // Step 4: For development/localhost only: simulate beforeinstallprompt
  // This allows testing without deploying to a real domain
  if (isDev) {
    console.log("🔧 Development mode detected - will simulate beforeinstallprompt");

    // Wait for page to load, then check if event fired naturally
    setTimeout(() => {
      // Create a marker to track if real event fired
      let realEventFired = false;

      // Temporary listener to detect real event
      const checkListener = () => {
        realEventFired = true;
        window.removeEventListener("beforeinstallprompt", checkListener);
      };

      window.addEventListener("beforeinstallprompt", checkListener);

      // If real event didn't fire after a short delay, create synthetic one
      setTimeout(() => {
        if (!realEventFired) {
          console.log("📝 No natural event detected - creating synthetic beforeinstallprompt");

          // Create a mock event that triggers the install flow
          const mockEvent = new Event("beforeinstallprompt") as any;

          // Mock prompt method
          mockEvent.prompt = async () => {
            console.log("📥 Install prompt was called!");
            return;
          };

          // Mock userChoice promise
          mockEvent.userChoice = Promise.resolve({ outcome: "dismissed" });

          // Dispatch the synthetic event
          window.dispatchEvent(mockEvent);
          console.log("📤 Synthetic beforeinstallprompt dispatched");
        } else {
          console.log("✅ Real beforeinstallprompt event fired naturally");
        }

        window.removeEventListener("beforeinstallprompt", checkListener);
      }, 500);
    }, 1000);
  } else {
    console.log("🌐 Production mode - relying on native beforeinstallprompt");
  }

  console.log("✅ PWA initialization complete");
}
