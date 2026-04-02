import React from 'react';
import { Cloud } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-8 text-center sm:text-left flex items-center justify-center sm:justify-start gap-4">
      <div className="bg-primary/20 p-3 rounded-2xl flex items-center justify-center shadow-inner">
        <Cloud className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-text mb-1 tracking-tight">Cloud Storage</h1>
        <p className="text-text-muted text-sm sm:text-base">Upload images to your server and get public URLs instantly</p>
      </div>
    </header>
  );
};
