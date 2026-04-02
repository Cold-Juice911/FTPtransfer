import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Folder } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

export const CustomSelect: React.FC<Props> = ({ value, onChange, options, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-background border rounded-xl px-4 py-2.5 text-sm text-left transition-all duration-150
          ${isOpen
            ? 'border-primary/50 ring-2 ring-primary/30'
            : 'border-taupe-200 hover:border-taupe-300'
          }
          ${!selectedOption ? 'text-text-muted' : 'text-text'}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border border-taupe-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors
                    ${isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text hover:bg-taupe-50'
                    }`}
                >
                  <span className="shrink-0">{option.icon}</span>
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Builds the option list for the folder select dropdown.
 */
export function buildFolderOptions(folders: { name: string }[]): DropdownOption[] {
  const opts: DropdownOption[] = [
    { value: '__new__', label: 'Create New Folder', icon: <Plus className="w-4 h-4 text-primary" /> },
    ...folders.map(f => ({
      value: f.name,
      label: f.name,
      icon: <Folder className="w-4 h-4 text-primary" fill="currentColor" fillOpacity={0.15} />,
    })),
  ];
  return opts;
}
