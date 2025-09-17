// src/components/ui/ConfirmationModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  icon,
}) => {
  // Determine colors and default icon based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          iconColor: 'text-red-500',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          defaultIcon: <Trash2 className="w-6 h-6" />,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          iconColor: 'text-blue-500',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          defaultIcon: <Info className="w-6 h-6" />,
        };
      case 'success':
        return {
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          iconColor: 'text-green-500',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          defaultIcon: <CheckCircle className="w-6 h-6" />,
        };
      default:
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with icon */}
              <div className={`p-6 ${styles.bgColor} border-b ${styles.borderColor}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-black/20 ${styles.iconColor}`}>
                      {icon || styles.defaultIcon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                  </div>
                  <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="p-6">
                <p className="text-gray-300 text-base leading-relaxed">{message}</p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 text-white rounded-lg font-medium transition-colors ${styles.buttonColor}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for easier usage
export const useConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmationModalProps, 'isOpen' | 'onConfirm' | 'onCancel'>>({
    title: '',
    message: '',
  });
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((options: Omit<ConfirmationModalProps, 'isOpen' | 'onConfirm' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      setConfig(options);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = React.useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return {
    confirm,
    ConfirmationModal: (
      <ConfirmationModal
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...config}
      />
    ),
  };
};