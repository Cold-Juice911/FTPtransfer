import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onCancel}>
      <div 
        className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl border border-taupe-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-text font-medium mb-6 leading-relaxed">{message}</p>
          
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-taupe-200 text-text font-medium hover:bg-taupe-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
