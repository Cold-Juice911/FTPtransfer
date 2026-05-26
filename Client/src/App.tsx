import { useState, useCallback } from 'react';
import { Sidebar, TabId } from './components/Sidebar';
import { ConnectionCard } from './components/ConnectionCard';
import { FolderBrowserCard } from './components/FolderBrowserCard';
import { UploadCard } from './components/UploadCard';
import { GoDaddyPage } from './components/GoDaddyPage';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SftpCredentials, FolderEntry } from './types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ModalState {
  isOpen: boolean;
  message: string;
  action: () => void;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('hostinger-browser');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ── Hostinger credentials ──
  const HOSTINGER_PRESET: Partial<SftpCredentials> = {
    host: '145.79.210.181',
    user: 'u608833076',
    password: '*e4pnLhyPgt8ut#',
    port: 65002,
  };

  const [credentials, setCredentials] = useState<SftpCredentials>({
    host: '',
    user: '',
    password: '',
    port: 65002,
    domain: 'paleturquoise-lion-613082.hostingersite.com',
  });

  // ── GoDaddy credentials ──
  const GODADDY_PRESET: Partial<SftpCredentials> = {
    host: '184.168.97.113',
    user: 'afpsx7bu0o7r',
    password: '95PP@xUwfg3fFtu$',
    port: 22,
  };

  const [gdCredentials, setGdCredentials] = useState<SftpCredentials>({
    host: '',
    user: '',
    password: '',
    port: 22,
    domain: 'brijvrindafarms.in',
  });

  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [gdFolders, setGdFolders] = useState<FolderEntry[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal State
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    action: () => {},
  });

  const confirmDelete = useCallback((message: string, action: () => void) => {
    setModalState({ isOpen: true, message, action });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const fillHostingerPreset = useCallback(() => {
    setCredentials((prev) => ({
      ...prev,
      ...HOSTINGER_PRESET,
    }));
    handleRefresh();
  }, [handleRefresh]);

  const fillGoDaddyPreset = useCallback(() => {
    setGdCredentials((prev) => ({
      ...prev,
      ...GODADDY_PRESET,
    }));
    handleRefresh();
  }, [handleRefresh]);

  const hostingerConnected = credentials.host !== '' && credentials.user !== '';
  const godaddyConnected = gdCredentials.host !== '' && gdCredentials.user !== '';

  const renderContent = () => {
    // ── HOSTINGER TABS ──
    if (activeTab.startsWith('hostinger-')) {
      if (activeTab === 'hostinger-settings') {
        return (
          <div className="card-enter max-w-2xl mx-auto py-4">
            <ConnectionCard
              credentials={credentials}
              onChange={setCredentials}
              onConnect={handleRefresh}
              onPreset={fillHostingerPreset}
              presetLabel="Load Hostinger"
            />
          </div>
        );
      }

      // Check if Hostinger is configured for browser/upload tabs
      if (!hostingerConnected) {
        return (
          <div className="card-enter flex flex-col items-center justify-center text-center p-8 py-16 bg-card border border-taupe-200 rounded-2xl max-w-xl mx-auto shadow-sm my-8">
            <div className="w-14 h-14 rounded-full bg-taupe-100 flex items-center justify-center mb-4 text-primary">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Hostinger SFTP Connection Required</h2>
            <p className="text-sm text-text-muted max-w-md mb-6">
              You must load or enter your Hostinger SFTP credentials in settings to browse files or upload folders.
            </p>
            <button
              onClick={() => setActiveTab('hostinger-settings')}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              Configure Connection Settings
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      }

      if (activeTab === 'hostinger-browser') {
        return (
          <div className="card-enter">
            <FolderBrowserCard
              credentials={credentials}
              folders={folders}
              setFolders={setFolders}
              onConfirmDelete={confirmDelete}
              refreshTrigger={refreshTrigger}
            />
          </div>
        );
      }

      if (activeTab === 'hostinger-upload') {
        return (
          <div className="card-enter max-w-3xl mx-auto">
            <UploadCard
              credentials={credentials}
              folders={folders}
              onUploadSuccess={handleRefresh}
            />
          </div>
        );
      }
    }

    // ── GO DADDY TABS ──
    if (activeTab.startsWith('godaddy-')) {
      const activeSubTab = activeTab.replace('godaddy-', '') as 'browser' | 'upload' | 'settings';

      if (activeSubTab === 'settings') {
        return (
          <div className="card-enter max-w-2xl mx-auto py-4">
            <ConnectionCard
              credentials={gdCredentials}
              onChange={setGdCredentials}
              onConnect={handleRefresh}
              onPreset={fillGoDaddyPreset}
              presetLabel="Load GoDaddy"
              label="Go Daddy"
            />
          </div>
        );
      }

      // Check if GoDaddy is configured
      if (!godaddyConnected) {
        return (
          <div className="card-enter flex flex-col items-center justify-center text-center p-8 py-16 bg-card border border-taupe-200 rounded-2xl max-w-xl mx-auto shadow-sm my-8">
            <div className="w-14 h-14 rounded-full bg-taupe-100 flex items-center justify-center mb-4 text-primary">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">GoDaddy SFTP Connection Required</h2>
            <p className="text-sm text-text-muted max-w-md mb-6">
              Please enter your GoDaddy SFTP server details in the Connection Settings tab first to start managing files.
            </p>
            <button
              onClick={() => setActiveTab('godaddy-settings')}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              Configure Connection Settings
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      }

      if (activeSubTab === 'upload') {
        return (
          <div className="card-enter max-w-3xl mx-auto">
            <UploadCard
              credentials={gdCredentials}
              folders={gdFolders}
              onUploadSuccess={handleRefresh}
              serviceType="godaddy"
            />
          </div>
        );
      }

      return (
        <div className="card-enter">
          <GoDaddyPage
            credentials={gdCredentials}
            folders={gdFolders}
            setFolders={setGdFolders}
            onConfirmDelete={confirmDelete}
            refreshTrigger={refreshTrigger}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── Left Sidebar ── */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hostingerConnected={hostingerConnected}
        godaddyConnected={godaddyConnected}
        isOpen={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* ── Main Workspace ── */}
      <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        onConfirm={modalState.action}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
