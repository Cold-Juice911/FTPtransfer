import React from 'react';
import { 
  Cloud, 
  Server, 
  Folder, 
  Upload, 
  Settings, 
  ShieldCheck, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export type TabId = 
  | 'hostinger-browser' 
  | 'hostinger-upload' 
  | 'hostinger-settings' 
  | 'godaddy-browser' 
  | 'godaddy-upload' 
  | 'godaddy-settings';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  hostingerConnected: boolean;
  godaddyConnected: boolean;
  isOpen: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  hostingerConnected,
  godaddyConnected,
  isOpen,
  onToggleMobile,
}) => {
  const categories = [
    {
      title: 'Hostinger SFTP',
      id: 'hostinger',
      connected: hostingerConnected,
      icon: <Cloud className="w-5 h-5" />,
      items: [
        { id: 'hostinger-browser' as TabId, label: 'Folder Browser', icon: <Folder className="w-4 h-4" /> },
        { id: 'hostinger-upload' as TabId, label: 'Upload System', icon: <Upload className="w-4 h-4" /> },
        { id: 'hostinger-settings' as TabId, label: 'Connection Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    },
    {
      title: 'GoDaddy SFTP',
      id: 'godaddy',
      connected: godaddyConnected,
      icon: <Server className="w-5 h-5" />,
      items: [
        { id: 'godaddy-browser' as TabId, label: 'Folder Browser', icon: <Folder className="w-4 h-4" /> },
        { id: 'godaddy-upload' as TabId, label: 'Upload System', icon: <Upload className="w-4 h-4" /> },
        { id: 'godaddy-settings' as TabId, label: 'Connection Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={onToggleMobile}
          className="p-3 bg-card border border-taupe-200 rounded-xl text-text hover:bg-taupe-100 transition-colors shadow-sm"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 w-72 bg-card/85 backdrop-blur-md border-r border-taupe-200 flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:z-10
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="space-y-6">
          {/* Header Branding */}
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="bg-primary/20 p-2.5 rounded-xl flex items-center justify-center shadow-inner">
              <Cloud className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text tracking-tight leading-none">Antigravity FTP</h1>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">File Manager</span>
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between px-2.5 py-1 bg-taupe-50/50 rounded-xl border border-taupe-100/30">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{cat.icon}</span>
                    <span className="text-xs font-bold text-text-muted tracking-wider uppercase">{cat.title}</span>
                  </div>
                  {cat.connected ? (
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-green-200/50">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-taupe-100 text-text-muted/60 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-taupe-200/40">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>Offline</span>
                    </div>
                  )}
                </div>

                {/* Category Items */}
                <div className="space-y-1 pl-1">
                  {cat.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (window.innerWidth < 1024) {
                            onToggleMobile();
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all duration-200 group
                          ${isActive
                            ? 'bg-primary text-white shadow-md shadow-primary/20 border border-primary'
                            : 'text-text-muted hover:text-text hover:bg-taupe-100/60 border border-transparent'
                          }`}
                      >
                        <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-primary/70'}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info */}
        <div className="px-2 border-t border-taupe-100/60 pt-4 flex items-center justify-between text-[10px] text-text-muted/60">
          <span>v2.1.0 • Antigravity AI</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Status: Good" />
        </div>
      </aside>
    </>
  );
};
