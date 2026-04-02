import React from 'react';
import { Link } from 'lucide-react';
import { SftpCredentials } from '../types';

interface Props {
  credentials: SftpCredentials;
  onChange: (creds: SftpCredentials) => void;
}

export const ConnectionCard: React.FC<Props> = ({ credentials, onChange }) => {
  const handleChange = (field: keyof SftpCredentials, value: string) => {
    onChange({ ...credentials, [field]: field === 'port' ? parseInt(value) || 65002 : value });
  };

  return (
    <section className="bg-card shadow-sm rounded-2xl border border-taupe-200 p-5 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-taupe-100">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Link className="text-primary w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text">SFTP Connection</h2>
          <p className="text-sm text-text-muted">Enter your Hostinger SFTP credentials</p>
        </div>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start" autoComplete="off">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-text">SFTP Hostname / IP</label>
          <input
            className="w-full bg-background border border-taupe-200 rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            type="text"
            placeholder="123.234.456.87"
            value={credentials.host}
            onChange={(e) => handleChange('host', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-text">Port</label>
          <input
            className="w-full bg-background border border-taupe-200 rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            type="number"
            placeholder="21 / 22 / 65002"
            value={credentials.port || ''}
            onChange={(e) => handleChange('port', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-text">Username</label>
          <input
            className="w-full bg-background border border-taupe-200 rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            type="text"
            placeholder="SFTP username"
            value={credentials.user}
            onChange={(e) => handleChange('user', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-text">Password</label>
          <input
            className="w-full bg-background border border-taupe-200 rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            type="password"
            placeholder="SFTP password"
            value={credentials.password || ''}
            onChange={(e) => handleChange('password', e.target.value)}
          />
        </div>
      </form>
    </section>
  );
};
