// src/components/PWAInstall.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

// Minimal typing for the deferred install prompt event
type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already dismissed (7-day cooldown)
    try {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    } catch {
      // Ignore storage errors
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a short delay
      const t = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(t);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    try {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (process.env.NODE_ENV === 'development') {
        console.log('PWA install prompt outcome:', outcome);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  };

  if (!showPrompt || (!deferredPrompt && !isIOS)) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Install PantyPost App"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
        aria-label="Dismiss install prompt"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Download className="h-8 w-8 text-[#ff950e]" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">Install PantyPost App</h3>
          <p className="text-gray-400 text-sm mb-3">
            Install our app for a better experience with offline access and notifications.
          </p>

          {isIOS ? (
            <p className="text-gray-500 text-xs">Tap the share button and select &quot;Add to Home Screen&quot;</p>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-[#ff950e] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#ff8c00] transition-colors"
            >
              Install Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
