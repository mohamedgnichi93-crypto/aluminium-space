import { useState, useEffect } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function getBrowserInfo() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isFirefox =
    ua.includes('Firefox') || ua.includes('FxiOS');
  const isSamsungInternet = ua.includes('SamsungBrowser');
  const isChrome =
    ua.includes('Chrome') && !ua.includes('Edg') && !isSamsungInternet;
  const isEdge = ua.includes('Edg');
  const isSafari =
    /^((?!chrome|android|fxios|crios).)*safari/i.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;
  return {
    isIOS,
    isFirefox,
    isSafari,
    isChrome,
    isEdge,
    isSamsungInternet,
    isStandalone,
  };
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(
      (window as any).__pwaInstallPrompt ?? null
    );
  const [isInstalled, setIsInstalled] = useState(false);
  const browser = getBrowserInfo();

  useEffect(() => {
    if (browser.isStandalone) {
      setIsInstalled(true);
      return;
    }
    if ((window as any).__pwaInstallPrompt) {
      setInstallPrompt((window as any).__pwaInstallPrompt);
    }
    const onReady = (e: Event) => {
      const detail = (e as CustomEvent).detail as InstallPromptEvent;
      setInstallPrompt(detail);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    };
    window.addEventListener('pwa-install-ready', onReady);
    window.addEventListener('pwa-installed', onInstalled);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('pwa-install-ready', onReady);
      window.removeEventListener('pwa-installed', onInstalled);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Button visible on ALL platforms except already installed
  const canInstall = !isInstalled && (
    installPrompt !== null ||  // Chrome, Edge, Samsung, new iOS
    browser.isIOS ||           // iOS Safari (share sheet trick)
    browser.isFirefox          // Firefox (about:config install)
  );

  const install = async () => {
    if (installPrompt) {
      // Native prompt — Chrome, Edge, Samsung, iOS ≥16.4
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallPrompt(null);
          (window as any).__pwaInstallPrompt = null;
        }
      } catch (err) {
        console.warn('Install prompt failed:', err);
      }
      return;
    }

    if (browser.isIOS) {
      // iOS Safari: trigger native share sheet pointing to PWA
      // Share sheet shows "Add to Home Screen" automatically
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Aluminium Space',
            text: 'Installez notre application',
            url: window.location.href,
          });
        } catch (_) {}
      }
      return;
    }

    if (browser.isFirefox) {
      // Firefox: open install page in new tab
      // Firefox supports PWA install via address bar on Android
      window.open(window.location.href, '_blank');
      return;
    }
  };

  return {
    canInstall,
    isInstalled,
    install,
    // Keep these for any remaining conditional UI if needed
    isIOS: browser.isIOS,
    isFirefox: browser.isFirefox,
  };
}
