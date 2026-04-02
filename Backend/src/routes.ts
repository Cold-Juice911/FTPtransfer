import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  SftpCredentials,
  UploadResponse,
  FilesResponse,
  FoldersResponse,
  DeleteResponse,
  RenameResponse,
} from "./types";
import {
  uploadFiles,
  listFiles,
  listFolders,
  deleteFile,
  deleteFolder,
  renameFolder,
  renameFile,
} from "./ftpService";

const router = Router();

// Configure multer to store files temporarily
const tmpDir = path.join(process.cwd(), "tmp_uploads");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const baseName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
    const uniqueName = `${baseName}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * Helper to extract base SFTP credentials from request body.
 */
function extractCredentials(body: Record<string, string>): SftpCredentials | null {
  const { host, user, password, port, domain } = body;
  if (!host || !user || !password || !port || !domain) return null;
  return {
    host,
    user,
    password,
    port: parseInt(port, 10),
    domain,
    folder: body.folder || undefined,
  };
}

/**
 * POST /api/upload
 * Upload images via SFTP to the remote server.
 */
router.post(
  "/upload",
  upload.array("files", 20),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as Record<string, string>;
      const credentials = extractCredentials(body);

      if (!credentials || !credentials.folder) {
        res.status(400).json({
          success: false,
          urls: [],
          message: "Missing required fields (host, user, password, port, domain, folder)",
        } satisfies UploadResponse);
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          urls: [],
          message: "No files provided",
        } satisfies UploadResponse);
        return;
      }

      const urls = await uploadFiles(credentials, files);

      // Clean up temp files
      for (const file of files) {
        fs.unlink(file.path, () => {});
      }

      res.json({
        success: true,
        urls,
        message: `Successfully uploaded ${urls.length} file(s)`,
      } satisfies UploadResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({
        success: false,
        urls: [],
        message: `Upload failed: ${message}`,
      } satisfies UploadResponse);
    }
  }
);

/**
 * POST /api/files
 * List all files in a folder and return public URLs.
 */
router.post("/files", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);

    if (!credentials || !credentials.folder) {
      res.status(400).json({
        success: false,
        files: [],
        message: "Missing required fields (host, user, password, port, domain, folder)",
      } satisfies FilesResponse);
      return;
    }

    const files = await listFiles(credentials);

    res.json({
      success: true,
      files,
      message: `Found ${files.length} file(s)`,
    } satisfies FilesResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      files: [],
      message: `Failed to list files: ${message}`,
    } satisfies FilesResponse);
  }
});

/**
 * POST /api/folders
 * List all folders inside public_html.
 */
router.post("/folders", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);

    if (!credentials) {
      res.status(400).json({
        success: false,
        folders: [],
        message: "Missing required fields (host, user, password, port, domain)",
      } satisfies FoldersResponse);
      return;
    }

    const folders = await listFolders(credentials);

    res.json({
      success: true,
      folders,
      message: `Found ${folders.length} folder(s)`,
    } satisfies FoldersResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      folders: [],
      message: `Failed to list folders: ${message}`,
    } satisfies FoldersResponse);
  }
});

/**
 * DELETE /api/file
 * Delete a specific file from a folder.
 */
router.delete("/file", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);
    const filename = body.filename;

    if (!credentials || !credentials.folder || !filename) {
      res.status(400).json({
        success: false,
        message: "Missing required fields (host, user, password, port, domain, folder, filename)",
      } satisfies DeleteResponse);
      return;
    }

    await deleteFile(credentials, filename);

    res.json({
      success: true,
      message: `Successfully deleted "${filename}"`,
    } satisfies DeleteResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: `Failed to delete file: ${message}`,
    } satisfies DeleteResponse);
  }
});

/**
 * DELETE /api/folder
 * Delete a folder and all its contents.
 */
router.delete("/folder", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);
    const folderName = body.folderName;

    if (!credentials || !folderName) {
      res.status(400).json({
        success: false,
        message: "Missing required fields (host, user, password, port, domain, folderName)",
      } satisfies DeleteResponse);
      return;
    }

    await deleteFolder(credentials, folderName);

    res.json({
      success: true,
      message: `Successfully deleted folder "${folderName}" and all its contents`,
    } satisfies DeleteResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: `Failed to delete folder: ${message}`,
    } satisfies DeleteResponse);
  }
});

/**
 * PATCH /api/folder
 * Rename a folder inside public_html.
 */
router.patch("/folder", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);
    const oldName = body.oldName;
    const newName = body.newName;

    if (!credentials || !oldName || !newName) {
      res.status(400).json({
        success: false,
        message: "Missing required fields (host, user, password, port, domain, oldName, newName)",
      } satisfies RenameResponse);
      return;
    }

    await renameFolder(credentials, oldName, newName);

    res.json({
      success: true,
      message: `Successfully renamed folder "${oldName}" to "${newName}"`,
    } satisfies RenameResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: `Failed to rename folder: ${message}`,
    } satisfies RenameResponse);
  }
});

/**
 * PATCH /api/file
 * Rename a file inside a folder.
 */
router.patch("/file", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const credentials = extractCredentials(body);
    const oldName = body.oldName;
    const newName = body.newName;

    if (!credentials || !credentials.folder || !oldName || !newName) {
      res.status(400).json({
        success: false,
        message: "Missing required fields (host, user, password, port, domain, folder, oldName, newName)",
      } satisfies RenameResponse);
      return;
    }

    await renameFile(credentials, oldName, newName);

    res.json({
      success: true,
      message: `Successfully renamed file "${oldName}" to "${newName}"`,
    } satisfies RenameResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: `Failed to rename file: ${message}`,
    } satisfies RenameResponse);
  }
});

export default router;
