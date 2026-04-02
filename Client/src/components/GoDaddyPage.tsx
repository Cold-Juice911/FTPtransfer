import React from 'react';
import { Construction } from 'lucide-react';

export const GoDaddyPage: React.FC = () => {
  return (
    <div className="col-span-full">
      <div className="bg-card shadow-sm rounded-2xl border border-taupe-200 p-12 text-center card-enter">
        <div className="w-16 h-16 bg-taupe-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Go Daddy — Coming Soon</h2>
        <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed">
          Go Daddy integration is under development. Stay tuned for SFTP file management for your Go Daddy hosted sites.
        </p>
      </div>
    </div>
  );
};
