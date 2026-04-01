# Cloud Storage (FTP Transfer)

A full-stack, lightweight web client built to seamlessly transfer images from your local machine to your remote FTP server (specifically tailored to bypass Hostinger Website Builder/CMS routing issues). It auto-generates immediately usable, public-facing URLs.

## ✨ Features
* **Modern UI:** Glassmorphism UI with smooth CSS animations, drag-and-drop file uploads, and a responsive design.
* **Smart Organization:** Dynamically create new folders (e.g. `cats`, `banners`) directly inside `public_html/` on the fly.
* **Auto-Sanitization:** Handles unique timestamped filenames natively to prevent frustrating file overwrite collisions.
* **Bypass CMS Routing:** Built specifically to integrate Hostinger's raw File/Preview URLs, letting you serve static images cleanly even if your primary domain is intercepted by a website builder like Zyro.

## 📦 Dependencies

### Backend
* **[express](https://expressjs.com/)**: Fast, unopinionated web framework for Node.js.
* **[multer](https://www.npmjs.com/package/multer)**: Middleware for handling `multipart/form-data`, used exclusively for parsing the uploaded image files.
* **[basic-ftp](https://www.npmjs.com/package/basic-ftp)**: A very robust FTP client for Node.js. Chosen for its native Promise support and ability to effortlessly ensure remote directories (`client.ensureDir()`).
* **[tsx](https://www.npmjs.com/package/tsx)**: TypeScript execution environment for modern development. Allows us to run `server.ts` directly with live reloading.

### Frontend
* **Vanilla HTML / CSS / JS**: Zero-build frontend to keep the project completely lightweight and easy to modify on the fly. No React, Vue, or Webpack required.

## 🚀 How to Run

1. **Install Dependencies:**
   Make sure you have Node.js installed. In the project root, run:
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This will start the backend server via `tsx watch` (with auto-reloading enabled) and serve the frontend at `http://localhost:3000`.

3. **Access the Client:**
   Open your browser and navigate to `http://localhost:3000`.

## 💼 Proper Workflow

1. **Find your Preview URL:** 
   If you use a website builder that points your main domain's DNS away from your FTP `public_html` directory, your uploaded files won't be accessible there. Go to your hosting dashboard and find your **Preview URL** or **Temporary Domain** (e.g., `srv1990-files.hstgr.io/.../public_html` or `http://username.hostingerapp.com`).
2. **Connect:** 
   In the UI, enter your FTP Host, Port (usually 21), Username, and Password. In the "Hostinger File URL" field, paste your Preview URL.
3. **Choose Folder:**
   Type the name of the folder you want the images to live in (e.g., `cats`). If the folder doesn't exist remotely, the client will automatically create it.
4. **Upload:**
   Drag and drop your images into the UI, click upload. The files are securely streamed via FTP directly to your Hostinger server.
5. **Use the URLs:**
   Once successful, the frontend will automatically construct the hot-linkable URL by combining your Preview URL, the folder name, and the generated filename. Use the provided "Copy" button to instantly grab the link for use anywhere!

## 🔐 Security Note
Your FTP credentials are only sent from your browser to your local Node server temporarily during the upload process. They are never saved or stored anywhere permanently.
