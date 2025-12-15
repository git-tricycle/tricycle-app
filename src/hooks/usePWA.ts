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

export function usePWAInstall(): PWAInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== "web") {
      return;
    }

    setIsSupported(true);

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      } else if ((window.navigator as any).standalone) {
        // iOS Safari
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("PWA was installed");
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
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Error during PWA installation:", error);
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
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful:", registration);
          setRegistration(registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed:", error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_AVAILABLE") {
          setUpdateAvailable(true);
        }
      });
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
