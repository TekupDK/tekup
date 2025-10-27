import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizes[size]} mx-4 max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export interface ModalHeaderProps {
  children: ReactNode;
}

export function ModalHeader({ children }: ModalHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}

export interface ModalBodyProps {
  children: ReactNode;
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className="px-6 py-4">{children}</div>;
}

export interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
      {children}
    </div>
  );
}
