import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, FileText, Image, Folder, HelpCircle } from 'lucide-react';
import { SftpCredentials, FolderEntry } from '../types';
import { ApiService } from '../services/api';
import { GoDaddyApiService } from '../services/goDaddyApi';
import { CustomSelect, buildFolderOptions } from './CustomSelect';

interface Props {
  credentials: SftpCredentials;
  folders: FolderEntry[];
  onUploadSuccess: () => void;
  serviceType?: 'hostinger' | 'godaddy';
}

interface QueuedFile {
  file: File;
  relativePath: string;
}

// Helper to recursively extract files from drop entries
async function getFilesFromEntry(entry: any, path = ''): Promise<QueuedFile[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file: File) => {
        resolve([{ file, relativePath: path ? `${path}/${file.name}` : file.name }]);
      });
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    
    const readAllEntries = async (): Promise<any[]> => {
      let allEntries: any[] = [];
      const readBatch = (): Promise<any[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries((entries: any[]) => resolve(entries));
        });
      };
      
      let batch = await readBatch();
      while (batch.length > 0) {
        allEntries = [...allEntries, ...batch];
        batch = await readBatch();
      }
      return allEntries;
    };
    
    try {
      const entries = await readAllEntries();
      const results = await Promise.all(
        entries.map((childEntry) =>
          getFilesFromEntry(childEntry, path ? `${path}/${entry.name}` : entry.name)
        )
      );
      return results.flat();
    } catch (e) {
      console.error("Failed to read directory entries", e);
      return [];
    }
  }
  return [];
}

export const UploadCard: React.FC<Props> = ({ credentials, folders, onUploadSuccess, serviceType = 'hostinger' }) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files), false);
    e.target.value = '';
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files), true);
    e.target.value = '';
  };

  const addFiles = (newFiles: File[], isFolder: boolean) => {
    const toAdd: QueuedFile[] = newFiles.map(file => ({
      file,
      relativePath: isFolder ? (file.webkitRelativePath || file.name) : file.name
    }));

    setQueuedFiles(prev => {
      const existingPaths = new Set(prev.map(f => f.relativePath));
      const filtered = toAdd.filter(f => !existingPaths.has(f.relativePath));
      return [...prev, ...filtered];
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.items) {
      const entries: any[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }
      }
      
      if (entries.length > 0) {
        setUploading(true);
        setError(null);
        try {
          const parsed: QueuedFile[] = [];
          for (const entry of entries) {
            const filesFromEntry = await getFilesFromEntry(entry);
            parsed.push(...filesFromEntry);
          }
          
          setQueuedFiles(prev => {
            const existingPaths = new Set(prev.map(f => f.relativePath));
            const filtered = parsed.filter(f => !existingPaths.has(f.relativePath));
            return [...prev, ...filtered];
          });
        } catch (err) {
          setError("Failed to traverse dropped files/folders");
        } finally {
          setUploading(false);
        }
      }
    } else if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files), false);
    }
  };

  const removeFile = (index: number) => {
    setQueuedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const handleUpload = async () => {
    const folder = selectedFolder === '__new__' ? newFolderName.trim() : selectedFolder;
    if (!folder) {
      setError("Please select or create a destination folder");
      return;
    }
    if (!credentials.host || !credentials.user || !credentials.domain) {
      setError("Please fill in connection fields");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    const filesToUpload = queuedFiles.map(q => q.file);
    const relativePaths = queuedFiles.map(q => q.relativePath);

    const service = serviceType === 'godaddy' ? GoDaddyApiService : ApiService;

    try {
      const res = await service.uploadFiles(
        { ...credentials, folder }, 
        filesToUpload, 
        setProgress,
        relativePaths
      );
      if (res.success) {
        setSuccess(res.message);
        setQueuedFiles([]);
        onUploadSuccess();
      } else {
        setError(res.message);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <section
      className="bg-card shadow-sm rounded-2xl border border-taupe-200 p-5 flex flex-col"
      style={{ minHeight: '450px', maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-taupe-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Upload className="text-primary w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-0.5 text-text leading-tight font-sans">Upload Files &amp; Folders</h2>
            <p className="text-xs text-text-muted">Drag &amp; drop folders directly to preserve layout</p>
          </div>
        </div>
        <div className="group relative">
          <HelpCircle className="w-4 h-4 text-text-muted cursor-help" />
          <div className="pointer-events-none absolute right-0 top-6 w-56 p-2 bg-text text-white text-[10px] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            Dropping a folder uploads all containing images recursively, preserving directory hierarchy on the server automatically.
          </div>
        </div>
      </div>

      {/* Destination Folder Selection */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-text block mb-1.5">Destination Directory</label>
        <div className="flex flex-col gap-2">
          <CustomSelect
            value={selectedFolder}
            onChange={setSelectedFolder}
            options={buildFolderOptions(folders)}
            placeholder="Select directory..."
          />
          {selectedFolder === '__new__' && (
            <input
              type="text"
              className="w-full bg-background border border-taupe-200 rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              placeholder="New directory name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Main Drag-Drop / Files Listing Box */}
      <div className="flex-1 flex flex-col min-h-0">
        {queuedFiles.length === 0 ? (
          /* Empty Box showing selection paths */
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-150 flex-1 flex flex-col justify-center items-center cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99] drop-zone-active' : 'border-taupe-300 hover:border-primary hover:bg-background/40'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 bg-taupe-100 rounded-2xl flex items-center justify-center mb-3 text-primary shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-text font-bold text-sm mb-1">Drag files or entire folders here</p>
            <p className="text-text-muted text-xs mb-4">Or pick one of the options below</p>
            
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-background border border-taupe-300 hover:bg-taupe-100 hover:border-taupe-400 text-text text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                Browse Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5" />
                Upload Folder
              </button>
            </div>
            
            <p className="text-text-muted text-[10px] mt-4">JPG, PNG, GIF, WebP, SVG, PDF &#8226; Folder uploads preserve sub-structures</p>
          </div>
        ) : (
          /* Active files preview layout */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text">
                {queuedFiles.length} file{queuedFiles.length !== 1 ? 's' : ''} queued
                <span className="text-text-muted font-normal ml-1">
                  ({formatSize(queuedFiles.reduce((sum, f) => sum + f.file.size, 0))})
                </span>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  + Add Files
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  + Add Folder
                </button>
                <button
                  onClick={() => setQueuedFiles([])}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Clear Queue
                </button>
              </div>
            </div>

            {/* List with Relative Paths */}
            <ul className="space-y-1 overflow-y-auto pr-1 border border-taupe-200 rounded-xl p-2 bg-background flex-1 max-h-[220px]">
              {queuedFiles.map((q, i) => (
                <li key={i} className="flex items-center justify-between p-1.5 hover:bg-taupe-100 rounded-lg group transition-colors">
                  <div className="flex items-center gap-2 truncate max-w-[70%]">
                    {isPdf(q.file) ? (
                      <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Image className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                    <div className="flex flex-col truncate leading-tight">
                      <span className="text-xs font-semibold text-text truncate">{q.file.name}</span>
                      {q.relativePath !== q.file.name && (
                        <span className="text-[9px] text-text-muted truncate font-mono">{q.relativePath}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-text-muted">{formatSize(q.file.size)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="p-0.5 rounded bg-background border border-taupe-200 text-text opacity-0 group-hover:opacity-100 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Micro drop zone to append more via drags */}
            <div
              className={`border border-dashed rounded-xl p-2.5 text-center mt-2.5 cursor-pointer transition-colors duration-150
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-taupe-300 hover:border-primary/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-[10px] text-text-muted font-semibold">Drop files/folders here to append</p>
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*,.pdf,application/pdf" onChange={handleFileChange} />
        <input 
          type="file" 
          ref={folderInputRef} 
          className="hidden" 
          {...({ webkitdirectory: "", directory: "", multiple: true } as any)} 
          onChange={handleFolderChange} 
        />

        {/* Upload Progress */}
        {progress > 0 && (
          <div className="mt-3 flex-shrink-0">
            <div className="h-1.5 w-full bg-taupe-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-[10px] text-text-muted mt-0.5 font-bold">{progress}%</p>
          </div>
        )}

        {/* Error / Success states */}
        {(error || success) && (
          <div className={`p-2.5 rounded-xl text-xs mt-3 flex items-center gap-2 flex-shrink-0 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{error || success}</span>
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        disabled={queuedFiles.length === 0 || uploading}
        onClick={handleUpload}
        className="w-full bg-text mt-3 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading Directory/Files...' : `Upload ${queuedFiles.length > 0 ? `${queuedFiles.length} Item(s)` : 'Files & Folders'}`}
      </button>
    </section>
  );
};
