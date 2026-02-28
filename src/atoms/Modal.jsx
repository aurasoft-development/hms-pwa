import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
  containerClassName = '',
}) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-lg',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 pointer-events-none">
        <div
          ref={overlayRef}
          className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-md pointer-events-auto"
          onMouseDown={(e) => {
            if (e.target === overlayRef.current) {
              e.currentTarget._tracking = true;
            }
          }}
          onMouseUp={(e) => {
            if (e.target === overlayRef.current && e.currentTarget._tracking) {
              delete e.currentTarget._tracking;
              onClose();
            }
          }}
        />

        <div
          className={`relative bg-white rounded-[32px] text-left overflow-hidden shadow-2xl transform transition-all border border-white/20 ${sizes[size]} w-full flex flex-col max-h-[90vh] pointer-events-auto ${containerClassName}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div
            className="px-6 py-4 overflow-y-auto modal-scrollable flex-1"
            style={{
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}
          >
            {children}
          </div>
          <style>{`
            .modal-scrollable::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

