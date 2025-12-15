import { useEffect, useState } from "react";
import { Platform } from "react-native";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAInstallPrompt {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
  isSupported: boolean;
}

// Global store for the deferred prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let isAppInstalled = false;

// Initialize global listeners on app startup (check for window existence, not Platform.OS)
if (typeof window !== "undefined") {
  // Listen for beforeinstallprompt event GLOBALLY
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    console.log("🎯 beforeinstallprompt event fired!");
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });

  // Listen for app installed event GLOBALLY
  window.addEventListener("appinstalled", () => {
    console.log("✅ App installed!");
    isAppInstalled = true;
    globalDeferredPrompt = null;
  });

  // Check if already installed on load
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    isAppInstalled = true;
  } else if ((window.navigator as any).standalone) {
    isAppInstalled = true;
  }

  console.log("📱 PWA global initialization complete");
}

export function usePWAInstall(): PWAInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isAppInstalled);
  const [isSupported, setIsSupported] = useState(typeof window !== "undefined");

  useEffect(() => {
    // Run on web platform
    if (typeof window === "undefined") {
      return;
    }

    console.log("📱 usePWAInstall hook initializing");
    setIsSupported(true);

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        isAppInstalled = true;
      } else if ((window.navigator as any).standalone) {
        // iOS Safari
        setIsInstalled(true);
        isAppInstalled = true;
      }
    };

    checkInstalled();

    // Use the globally stored deferred prompt
    if (globalDeferredPrompt && !isAppInstalled) {
      console.log("✅ Setting deferred prompt from global store");
      setDeferredPrompt(globalDeferredPrompt);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("🎯 beforeinstallprompt received in hook");
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = event;
      setDeferredPrompt(event);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("✅ appinstalled received in hook");
      setIsInstalled(true);
      isAppInstalled = true;
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn("⚠️ No deferred prompt available");
      return;
    }

    try {
      console.log("🔔 Showing install prompt...");
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
      } else {
        console.log("❌ User dismissed the install prompt");
      }

      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    } catch (error) {
      console.error("❌ Error during PWA installation:", error);
    }
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    install,
    isSupported,
  };
}

// Hook to register service worker
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    // Check if service workers are supported
    if ("serviceWorker" in navigator) {
      // Delay service worker registration to allow beforeinstallprompt to fire first
      const swTimer = setTimeout(() => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("✅ ServiceWorker registration successful:", registration);
            setRegistration(registration);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("📦 Update available for PWA");
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("❌ ServiceWorker registration failed:", error);
          });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "UPDATE_AVAILABLE") {
            console.log("📦 Update available message from SW");
            setUpdateAvailable(true);
          }
        });
      }, 100); // 100ms delay

      return () => clearTimeout(swTimer);
    }
  }, []);

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  return {
    registration,
    updateAvailable,
    updateApp,
  };
}
