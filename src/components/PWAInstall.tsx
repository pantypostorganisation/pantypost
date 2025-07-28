// src/components/PWAInstall.tsx

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || (!deferredPrompt && !isIOS)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-4 z-50">
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
          <h3 className="text-white font-semibold mb-1">
            Install PantyPost App
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            Install our app for a better experience with offline access and notifications.
          </p>

          {isIOS ? (
            <p className="text-gray-500 text-xs">
              Tap the share button and select "Add to Home Screen"
            </p>
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