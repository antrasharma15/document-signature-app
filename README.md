# 📄 EASYsign — MERN Stack Document Signature Application

EASYsign is a premium, secure, and production-ready **MERN Stack** web application designed to upload, view, sign, and manage PDF documents. Built with a modern, interactive design, it allows users to assign signature placeholders via an interactive drag-and-drop editor, request signatures via email, track real-time audit trails, and finalize documents with embedded signatures.

---

## 🏷️ Badges

[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Server-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Hosting-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Hosting-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)

---

## 📸 Screenshots & Demo

### 🖥️ Dashboard Overview
![Dashboard](client/src/assets/dashboard.png)

### ✍️ Signing Workspace
![Signing Workspace](client/src/assets/signing%20workspace.jpeg)

### 📜 Document Audit Trail
![Audit Trail](client/src/assets/audit%20trail.jpeg)

---

## 📖 About the Project

This project was built to address file persistence issues on ephemeral hosting servers (like Render's Free tier). Instead of standard local disk file storage, **EASYsign** converts original and signed PDFs to base64 strings and stores them securely inside MongoDB. This completely eliminates file-loss on server restarts, making the application fully stateless, highly scalable, and 100% compatible with free cloud hosting tiers.

---

## ✨ Features

* **🔒 Secure JWT Authentication**: User registration and login, password hashing via `bcryptjs`, and route guards protecting private endpoints.
* **⚡ Email Verification & Password Reset**: Automated secure flows containing tokenized verification and reset links sent via Nodemailer.
* **📂 Stateless PDF Upload & Storage**: Original PDFs are converted to base64 and saved to MongoDB. Temporary files are immediately deleted from disk.
* **✍️ Drag-and-Drop Signature Placement**: Interactive editor allowing document owners to place and scale signature fields on any page of the PDF.
* **🎛️ Dynamic Coordinate Mapping**: Uses mathematical scaling to accurately map percentage-based canvas coordinates from the browser to absolute points on the PDF document regardless of resolution.
* **📜 Real-Time Audit Logs**: Automatically logs all key actions (creation, viewing, signing, rejection, and download) with timestamps, performer details, and IP addresses.
* **📥 Secure Signed Downloads**: Compiles finalized PDFs in the backend using `pdf-lib` and serves them securely via dynamic streaming.

---

## 🛠️ Tech Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Framer Motion, Axios, `react-pdf`, Lucide Icons |
| **Backend** | Node.js, Express.js, Multer, `pdf-lib`, Nodemailer, `validator` |
| **Database** | MongoDB Atlas, Mongoose (ODM) |
| **Authentication**| JSON Web Tokens (JWT), BcryptJS |
| **Deployment** | Vercel (Client Hosting) & Render (Server API Hosting) |

---

## 📁 Folder Structure

```text
document-signature-app/
├── client/                     # Frontend React Project
│   ├── src/
│   │   ├── api/                # Axios instance configuration
│   │   ├── assets/             # Images, mockups, and visual assets
│   │   ├── components/         # Reusable UI elements (Hero, Sidebar, AuditTrail)
│   │   ├── context/            # AuthContext (state management)
│   │   ├── pages/              # Pages (Login, Register, Dashboard, Signing)
│   │   └── main.jsx            # React main entry point
│   ├── package.json
│   └── vite.config.js
│
└── server/                     # Backend Node/Express API
    ├── middleware/             # Route protection middleware
    ├── models/                 # Database schemas (User, Document, Signature, AuditLog)
    ├── routes/                 # Express route controllers (auth, docs, signatures, audit)
    ├── utils/                  # Helper utilities (sendEmail, mailer, audit log writer)
    ├── nodemon.json            # Nodemon configuration
    ├── index.js                # Server startup entry file
    └── package.json
```

---

## ⚙️ Getting Started (Local Setup)

To run this project on your local machine, follow these steps:

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas Cloud database)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/antrasharma15/document-signature-app.git
   cd document-signature-app
   ```

2. **Backend Configuration & Setup**
   ```bash
   cd server
   npm install
   ```
   * Create a `.env` file in the `server/` directory and configure it as shown in the **Environment Variables** section.
   * Start the backend development server:
     ```bash
     npm run dev
     ```

3. **Frontend Configuration & Setup**
   * Open a new terminal window, navigate back to the root, and go to the client folder:
     ```bash
     cd client
     npm install
     ```
   * Start the frontend development server:
     ```bash
     npm run dev
     ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| **MONGO_URI** | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| **JWT_SECRET** | Token secret key for JWT session signing | `your_secret_session_key` |
| **EMAIL_USER** | Gmail email address used to send verification links | `yourname@gmail.com` |
| **EMAIL_PASS** | 16-character Gmail App Password | `abcd efgh ijkl mnop` |
| **CLIENT_URL** | Frontend URL (dynamic fallback handles changing IPs) | `http://localhost:5173` |

### Frontend (`client/.env` - Optional for Local, Required for Production)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| **VITE_API_URL** | Endpoint URL of the backend server | `https://your-api.onrender.com` |

---

## 📧 Email Setup (Nodemailer & Gmail)

For secure email transmission (verification codes, reset password links), EASYsign utilizes **Gmail SMTP**:
1. Go to your Google Account Settings.
2. Search for **App Passwords** (Ensure 2-Step Verification is enabled first).
3. Generate a new App Password for **Mail** and select **Other** for device (e.g. name it "EASYsign").
4. Copy the generated 16-character code (e.g., `kcky wwoe bggy oypy`).
5. Paste this 16-character code into the `EMAIL_PASS` field in your environment variables.

---

## 🚀 Deployment

### Backend (Render Web Service)
1. Set the **Root Directory** to `server`.
2. Select the **Free** tier (our MongoDB binary backend matches the free tier perfectly!).
3. Set the **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Copy all variables from your `server/.env` file to the Render **Environment** tab.

### Frontend (Vercel)
1. Import your repository and select the **Root Directory** as `client`.
2. Vercel will auto-configure to **Vite**.
3. Under Environment Variables, add **`VITE_API_URL`** pointing to your deployed Render URL (e.g., `https://easysign-api.onrender.com`).
4. Click **Deploy**.

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)

* `POST /register` - Register a new unverified user. Sends verification email.
* `POST /login` - Login verified user and return JWT session token.
* `GET /verify/:token` - Verify account via email token link.
* `POST /forgot-password` - Generate reset token and send email reset link.
* `POST /reset-password/:token` - Set a new password using reset link token.

### 📄 Documents (`/api/docs`)

* `POST /upload` - Upload PDF file, save to database, notify signer. *(Protected)*
* `GET /` - Fetch all documents uploaded by the logged-in user. *(Protected)*
* `GET /:id` - Get metadata for a specific document. *(Protected)*
* `DELETE /:id` - Delete document metadata and its entries. *(Protected)*

### ✍️ Signatures (`/api/signatures`)

* `POST /` - Save signature placeholder field and notify signer. *(Protected)*
* `GET /:fileId` - Retrieve all placeholders associated with a document. *(Protected)*
* `PATCH /:id/sign` - Submit signature image and complete a specific field. *(Protected)*
* `POST /finalize/:docId` - Embed all signatures onto original PDF and output signed copy. *(Protected)*
* `GET /download/:filename` - Stream signed PDF to client browser. *(Protected)*

---

## 🔮 Future Improvements

- [ ] **Cloud Storage Migration**: Transition from base64 database blobs to AWS S3/Supabase Storage with pre-signed URLs for highly optimized scaling.
- [ ] **Real-time Collaboration**: Integrate Socket.io (WebSockets) to show signatures placed on screen by other collaborators in real time.
- [ ] **SMS OTP Authentication**: Add telephone number validation with one-time codes for secondary identity check.
- [ ] **Mobile-Responsive Signature Canvas**: Native mobile editor layout to ease signing on touch screens.

---

## 👤 Author

* **Antra Sharma**
* Built as an **Internship Project** to demonstrate proficiency in complete full-stack MERN development, secure system workflows, and scalable cloud application deployments.
