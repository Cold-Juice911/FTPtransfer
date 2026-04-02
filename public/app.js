/** @type {File[]} */
let selectedFiles = [];

/** @type {string} Currently open folder name in the browser */
let currentOpenFolder = '';

/** @type {Array<{name: string}>} Cached folder list */
let cachedFolders = [];

// ---- DOM Elements ----
const fileInput = /** @type {HTMLInputElement} */ (document.getElementById('file-input'));
const dropzone = /** @type {HTMLDivElement} */ (document.getElementById('dropzone'));
const fileList = /** @type {HTMLUListElement} */ (document.getElementById('file-list'));
const uploadBtn = /** @type {HTMLButtonElement} */ (document.getElementById('upload-btn'));
const statusBar = /** @type {HTMLDivElement} */ (document.getElementById('upload-status'));
const progressContainer = /** @type {HTMLDivElement} */ (document.getElementById('progress-container'));
const progressFill = /** @type {HTMLDivElement} */ (document.getElementById('progress-fill'));
const progressText = /** @type {HTMLParagraphElement} */ (document.getElementById('progress-text'));

// Folder browser elements
const fetchFoldersBtn = /** @type {HTMLButtonElement} */ (document.getElementById('fetch-folders-btn'));
const folderBrowserStatus = /** @type {HTMLDivElement} */ (document.getElementById('folder-browser-status'));
const folderListContainer = /** @type {HTMLDivElement} */ (document.getElementById('folder-list-container'));
const folderListEl = /** @type {HTMLUListElement} */ (document.getElementById('folder-list'));
const openFolderView = /** @type {HTMLDivElement} */ (document.getElementById('open-folder-view'));
const openFolderName = /** @type {HTMLSpanElement} */ (document.getElementById('open-folder-name'));
const backToFoldersBtn = /** @type {HTMLButtonElement} */ (document.getElementById('back-to-folders-btn'));
const refreshFolderBtn = /** @type {HTMLButtonElement} */ (document.getElementById('refresh-folder-btn'));
const deleteFolderBtn = /** @type {HTMLButtonElement} */ (document.getElementById('delete-folder-btn'));
const folderFilesStatus = /** @type {HTMLDivElement} */ (document.getElementById('folder-files-status'));
const folderFilesContainer = /** @type {HTMLDivElement} */ (document.getElementById('folder-files-container'));
const folderEmptyState = /** @type {HTMLDivElement} */ (document.getElementById('folder-empty-state'));

// Upload folder selector
const uploadFolderSelect = /** @type {HTMLSelectElement} */ (document.getElementById('upload-folder-select'));
const newFolderRow = /** @type {HTMLDivElement} */ (document.getElementById('new-folder-row'));
const newFolderInput = /** @type {HTMLInputElement} */ (document.getElementById('new-folder-input'));

// Confirmation modal
const confirmModal = /** @type {HTMLDivElement} */ (document.getElementById('confirm-modal'));
const confirmModalMessage = /** @type {HTMLParagraphElement} */ (document.getElementById('confirm-modal-message'));
const confirmModalCancel = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-modal-cancel'));
const confirmModalConfirm = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-modal-confirm'));

// ---- Helpers ----
function getBaseCredentials() {
  return {
    host: /** @type {HTMLInputElement} */ (document.getElementById('ftp-host')).value.trim(),
    user: /** @type {HTMLInputElement} */ (document.getElementById('ftp-user')).value.trim(),
    password: /** @type {HTMLInputElement} */ (document.getElementById('ftp-password')).value,
    port: /** @type {HTMLInputElement} */ (document.getElementById('ftp-port')).value || '65002',
    domain: /** @type {HTMLInputElement} */ (document.getElementById('ftp-domain')).value.trim(),
  };
}

function getUploadFolder() {
  const selectVal = uploadFolderSelect.value;
  if (selectVal === '__new__') {
    return newFolderInput.value.trim();
  }
  return selectVal;
}

function validateBaseCredentials() {
  const creds = getBaseCredentials();
  if (!creds.host || !creds.user || !creds.password || !creds.domain) {
    showBrowserStatus('error', '⚠️ Please fill in all connection fields');
    return false;
  }
  return true;
}

/**
 * @param {HTMLDivElement} bar
 * @param {'success' | 'error' | 'loading'} type
 * @param {string} message
 */
function showStatusBar(bar, type, message) {
  bar.className = `status-bar status-bar--visible status-bar--${type}`;
  bar.innerHTML = type === 'loading'
    ? `<span class="spinner"></span> ${message}`
    : message;
}

/**
 * @param {'success' | 'error' | 'loading'} type
 * @param {string} message
 */
function showUploadStatus(type, message) {
  showStatusBar(statusBar, type, message);
}

/**
 * @param {'success' | 'error' | 'loading'} type
 * @param {string} message
 */
function showBrowserStatus(type, message) {
  showStatusBar(folderBrowserStatus, type, message);
}

/**
 * @param {'success' | 'error' | 'loading'} type
 * @param {string} message
 */
function showFolderFilesStatus(type, message) {
  showStatusBar(folderFilesStatus, type, message);
}

/** @param {HTMLDivElement} bar */
function hideStatusBar(bar) {
  bar.className = 'status-bar';
  bar.innerHTML = '';
}

/** @param {number} bytes */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

// ---- Confirmation Modal ----
/** @type {(() => void) | null} */
let confirmCallback = null;

/**
 * @param {string} message
 * @param {() => void} onConfirm
 */
function showConfirmModal(message, onConfirm) {
  confirmModalMessage.textContent = message;
  confirmCallback = onConfirm;
  confirmModal.style.display = 'flex';
}

function hideConfirmModal() {
  confirmModal.style.display = 'none';
  confirmCallback = null;
}

confirmModalCancel.addEventListener('click', hideConfirmModal);
confirmModalConfirm.addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  hideConfirmModal();
});
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) hideConfirmModal();
});

// ---- File Selection (Upload) ----
function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.innerHTML = `
      <span>🖼️ ${file.name}</span>
      <span style="color: var(--text-muted); font-size: 0.75rem;">(${formatSize(file.size)})</span>
      <button class="file-item__remove" data-index="${index}" title="Remove">✕</button>
    `;
    fileList.appendChild(li);
  });
  uploadBtn.disabled = selectedFiles.length === 0;
}

/** @param {FileList | File[]} newFiles */
function addFiles(newFiles) {
  const existingNames = new Set(selectedFiles.map(f => f.name));
  for (const file of newFiles) {
    if (!existingNames.has(file.name)) selectedFiles.push(file);
  }
  renderFileList();
}

fileInput.addEventListener('change', () => {
  if (fileInput.files) { addFiles(fileInput.files); fileInput.value = ''; }
});

fileList.addEventListener('click', (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  if (target.classList.contains('file-item__remove')) {
    selectedFiles.splice(parseInt(target.getAttribute('data-index') || '0', 10), 1);
    renderFileList();
  }
});

// ---- Drag & Drop ----
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dropzone--active'); });
dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dropzone--active'); });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dropzone--active');
  if (e.dataTransfer && e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
});

// ---- Upload Folder Select ----
uploadFolderSelect.addEventListener('change', () => {
  if (uploadFolderSelect.value === '__new__') {
    newFolderRow.style.display = 'flex';
    newFolderInput.focus();
  } else {
    newFolderRow.style.display = 'none';
    newFolderInput.value = '';
  }
});

// ---- Fetch Folders ----
fetchFoldersBtn.addEventListener('click', fetchFolders);

async function fetchFolders() {
  if (!validateBaseCredentials()) return;
  const creds = getBaseCredentials();
  fetchFoldersBtn.disabled = true;
  showBrowserStatus('loading', 'Connecting and fetching folders...');

  try {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const result = await res.json();
    if (result.success) {
      cachedFolders = result.folders;
      showBrowserStatus('success', `✅ ${result.message}`);
      renderFolderList(result.folders);
      populateFolderDropdown(result.folders);
      // Go back to folder list if we were in open folder view
      openFolderView.style.display = 'none';
      folderListContainer.style.display = 'block';
    } else {
      showBrowserStatus('error', `❌ ${result.message}`);
    }
  } catch (err) {
    showBrowserStatus('error', `❌ ${err instanceof Error ? err.message : 'Failed to fetch folders'}`);
  } finally {
    fetchFoldersBtn.disabled = false;
  }
}

/**
 * @param {Array<{name: string}>} folders
 */
function renderFolderList(folders) {
  folderListContainer.style.display = 'block';
  folderListEl.innerHTML = '';

  if (folders.length === 0) {
    folderListEl.innerHTML = `
      <li style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No folders found inside public_html
      </li>`;
    return;
  }

  folders.forEach((folder, i) => {
    const li = document.createElement('li');
    li.className = 'folder-item';
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <div class="folder-item__name">
        <span class="folder-item__icon">📁</span>
        <span>${folder.name}</span>
      </div>
      <button class="folder-item__delete" data-folder="${folder.name}" title="Delete folder">🗑️</button>
    `;

    // Double-click to open
    li.addEventListener('dblclick', () => openFolder(folder.name));

    folderListEl.appendChild(li);
  });

  // Attach delete handlers
  folderListEl.querySelectorAll('.folder-item__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderName = /** @type {HTMLElement} */ (e.currentTarget).getAttribute('data-folder');
      if (folderName) handleDeleteFolder(folderName);
    });
  });
}

/**
 * Populate the upload folder dropdown with fetched folders.
 * @param {Array<{name: string}>} folders
 */
function populateFolderDropdown(folders) {
  // Save current selection
  const currentVal = uploadFolderSelect.value;

  // Remove old dynamic options (keep first two: placeholder + create new)
  while (uploadFolderSelect.options.length > 2) {
    uploadFolderSelect.remove(2);
  }

  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.name;
    option.textContent = `📁 ${folder.name}`;
    uploadFolderSelect.appendChild(option);
  });

  // Restore selection if it still exists
  if (currentVal && [...uploadFolderSelect.options].some(o => o.value === currentVal)) {
    uploadFolderSelect.value = currentVal;
  }
}

// ---- Open Folder (double-click) ----
/**
 * @param {string} folderName
 */
async function openFolder(folderName) {
  currentOpenFolder = folderName;
  folderListContainer.style.display = 'none';
  openFolderView.style.display = 'block';
  openFolderName.textContent = `📂 ${folderName}`;
  await fetchFolderFiles(folderName);
}

backToFoldersBtn.addEventListener('click', () => {
  openFolderView.style.display = 'none';
  folderListContainer.style.display = 'block';
  currentOpenFolder = '';
  hideStatusBar(folderFilesStatus);
});

refreshFolderBtn.addEventListener('click', () => {
  if (currentOpenFolder) fetchFolderFiles(currentOpenFolder);
});

deleteFolderBtn.addEventListener('click', () => {
  if (currentOpenFolder) handleDeleteFolder(currentOpenFolder);
});

/**
 * @param {string} folderName
 */
async function fetchFolderFiles(folderName) {
  const creds = getBaseCredentials();
  showFolderFilesStatus('loading', `Fetching files from "${folderName}"...`);
  refreshFolderBtn.disabled = true;

  try {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds, folder: folderName }),
    });
    const result = await res.json();
    if (result.success) {
      showFolderFilesStatus('success', `✅ ${result.message}`);
      renderFolderFiles(result.files, folderName);
    } else {
      showFolderFilesStatus('error', `❌ ${result.message}`);
      folderFilesContainer.innerHTML = '';
      folderEmptyState.style.display = 'block';
      folderFilesContainer.appendChild(folderEmptyState);
    }
  } catch (err) {
    showFolderFilesStatus('error', `❌ ${err instanceof Error ? err.message : 'Failed to fetch files'}`);
  } finally {
    refreshFolderBtn.disabled = false;
  }
}

/**
 * @param {Array<{name: string, url: string, size: number}>} files
 * @param {string} folderName
 */
function renderFolderFiles(files, folderName) {
  folderFilesContainer.innerHTML = '';

  if (files.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <span class="empty-state__icon">📭</span>
      <p class="empty-state__text">This folder is empty</p>
    `;
    folderFilesContainer.appendChild(emptyDiv);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'folder-files-list';

  files.forEach((file, i) => {
    const li = document.createElement('li');
    li.className = 'folder-file-item';
    li.style.animationDelay = `${i * 0.04}s`;
    const sizeText = file.size > 0 ? formatSize(file.size) : '';

    li.innerHTML = `
      <img class="folder-file-item__preview" src="${file.url}" alt="${file.name}" loading="lazy" onerror="this.style.display='none'" />
      <div class="folder-file-item__info">
        <p class="folder-file-item__name" title="${file.name}">${file.name}</p>
        ${sizeText ? `<p class="folder-file-item__size">${sizeText}</p>` : ''}
      </div>
      <div class="folder-file-item__url-group">
        <input class="folder-file-item__url-input" type="text" value="${file.url}" readonly />
      </div>
      <div class="folder-file-item__actions">
        <button class="btn--copy" data-url="${file.url}">Copy</button>
        <button class="btn--delete-file" data-folder="${folderName}" data-filename="${file.name}" title="Delete file">🗑️</button>
      </div>
    `;
    ul.appendChild(li);
  });

  folderFilesContainer.appendChild(ul);

  // Copy handlers
  folderFilesContainer.querySelectorAll('.btn--copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = /** @type {HTMLElement} */ (e.currentTarget);
      const url = target.getAttribute('data-url');
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        target.textContent = '✓';
        target.classList.add('copied');
        setTimeout(() => { target.textContent = 'Copy'; target.classList.remove('copied'); }, 1500);
      } catch {
        const input = target.closest('.folder-file-item')?.querySelector('.folder-file-item__url-input');
        if (input instanceof HTMLInputElement) {
          input.select(); document.execCommand('copy');
          target.textContent = '✓';
          target.classList.add('copied');
          setTimeout(() => { target.textContent = 'Copy'; target.classList.remove('copied'); }, 1500);
        }
      }
    });
  });

  // Delete file handlers
  folderFilesContainer.querySelectorAll('.btn--delete-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.currentTarget);
      const folder = target.getAttribute('data-folder');
      const filename = target.getAttribute('data-filename');
      if (folder && filename) handleDeleteFile(folder, filename);
    });
  });
}

// ---- Delete File ----
/**
 * @param {string} folder
 * @param {string} filename
 */
function handleDeleteFile(folder, filename) {
  showConfirmModal(`Delete "${filename}" from "${folder}"? This cannot be undone.`, async () => {
    const creds = getBaseCredentials();
    showFolderFilesStatus('loading', `Deleting "${filename}"...`);

    try {
      const res = await fetch('/api/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, folder, filename }),
      });
      const result = await res.json();
      if (result.success) {
        showFolderFilesStatus('success', `✅ ${result.message}`);
        // Auto-refresh files in the current open folder
        await fetchFolderFiles(folder);
      } else {
        showFolderFilesStatus('error', `❌ ${result.message}`);
      }
    } catch (err) {
      showFolderFilesStatus('error', `❌ ${err instanceof Error ? err.message : 'Delete failed'}`);
    }
  });
}

// ---- Delete Folder ----
/**
 * @param {string} folderName
 */
function handleDeleteFolder(folderName) {
  showConfirmModal(`Delete folder "${folderName}" and ALL its contents? This cannot be undone.`, async () => {
    const creds = getBaseCredentials();
    showBrowserStatus('loading', `Deleting folder "${folderName}"...`);

    try {
      const res = await fetch('/api/folder', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...creds, folderName }),
      });
      const result = await res.json();
      if (result.success) {
        showBrowserStatus('success', `✅ ${result.message}`);
        // If we were inside the deleted folder, go back
        if (currentOpenFolder === folderName) {
          openFolderView.style.display = 'none';
          currentOpenFolder = '';
        }
        // Auto-refresh folder list
        await fetchFolders();
      } else {
        showBrowserStatus('error', `❌ ${result.message}`);
      }
    } catch (err) {
      showBrowserStatus('error', `❌ ${err instanceof Error ? err.message : 'Delete failed'}`);
    }
  });
}

// ---- Upload ----
uploadBtn.addEventListener('click', async () => {
  const folder = getUploadFolder();
  if (!folder) {
    showUploadStatus('error', '⚠️ Please select or create a destination folder');
    return;
  }

  const creds = getBaseCredentials();
  if (!creds.host || !creds.user || !creds.password || !creds.domain) {
    showUploadStatus('error', '⚠️ Please fill in all connection fields');
    return;
  }

  if (selectedFiles.length === 0) return;

  const formData = new FormData();
  formData.append('host', creds.host);
  formData.append('user', creds.user);
  formData.append('password', creds.password);
  formData.append('port', creds.port);
  formData.append('domain', creds.domain);
  formData.append('folder', folder);
  selectedFiles.forEach(file => formData.append('files', file));

  uploadBtn.disabled = true;
  showUploadStatus('loading', 'Connecting to server and uploading...');
  progressContainer.classList.add('progress-container--visible');
  progressFill.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + '%';
          progressText.textContent = pct + '%';
        }
      });
      xhr.addEventListener('load', () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid server response')); }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });

    const result = /** @type {{ success: boolean, urls: string[], message: string }} */ (response);
    if (result.success) {
      showUploadStatus('success', `✅ ${result.message}`);
      selectedFiles = [];
      renderFileList();

      // Auto-refresh: if folder browser has folders loaded, refresh the list
      if (cachedFolders.length > 0 || uploadFolderSelect.options.length > 2) {
        await fetchFolders();
      }

      // If the open folder matches the upload folder, refresh its files
      if (currentOpenFolder === folder) {
        await fetchFolderFiles(folder);
      }
    } else {
      showUploadStatus('error', `❌ ${result.message}`);
    }
  } catch (err) {
    showUploadStatus('error', `❌ ${err instanceof Error ? err.message : 'Upload failed'}`);
  } finally {
    uploadBtn.disabled = selectedFiles.length === 0;
    setTimeout(() => progressContainer.classList.remove('progress-container--visible'), 2000);
  }
});
