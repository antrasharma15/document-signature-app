# 📄 DocSign - Document Signature Application

DocSign is a modern, high-fidelity **MERN (MongoDB, Express, React, Node.js)** web application built to facilitate document uploading, viewing, signing, and signature requests management. The project is styled around a premium dark glassmorphism theme using **Tailwind CSS** and animated with **Framer Motion**.

---

## ✨ Features

- **🔒 Secure Authentication:** Signup and login workflows powered by JWT (JSON Web Tokens) and password hashing via `bcryptjs`.
- **📊 Modern Interactive Dashboard:** Clean, visual user dashboard tracking document statistics, upload capabilities, active navigation, and dynamic greeting states.
- **📁 PDF Uploads & Management:** Robust file storage using `multer` with filtering to accept `.pdf` formats only.
- **👁️ Integrated PDF Viewer:** Built-in modal viewer powered by `react-pdf` to preview documents inline without leaving the platform.
- **📦 Drag-and-Drop / Button Triggers:** Interactive file picker integrated with React state feedback.
- **⚡ Framer Motion Transitions:** Dynamic animations for page entry, staggered stats card reveal, and responsive navigation components.

---

## 🎨 Visual Design System

The application incorporates a strict, consistent layout style:
- **Background:** Core pitch black (`bg-black`).
- **Accent Glow:** Centered pink radial glowing vector:
  ```jsx
  <div className="fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[150px] pointer-events-none" />
  ```
- **Surfaces & Cards:** Glassmorphic cards styled with `bg-zinc-900/80 backdrop-blur-lg border border-pink-500/20 rounded-2xl`.
- **Typography:** Sleek sans-serif hierarchy utilizing primary white highlights and text-zinc-400 subtexts.
- **Alert / Status Pills:** Styled status pills dynamically tracking document progress (Signed, Pending, Rejected).

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **Vite**
- **Tailwind CSS** & **PostCSS**
- **Framer Motion** (smooth layout animations)
- **React Router Dom** (SPA Client routing)
- **React PDF** (in-browser PDF rendering)

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose** (ODM)
- **Multer** (file upload handling)
- **JWT** (Authorization middleware)
- **pdf-lib** (PDF signing & manipulation)

---

## 📁 Directory Structure

```text
document-signature-app/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios API config
│   │   ├── assets/         # App assets & media
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # Authentication context
│   │   ├── pages/          # Layout Pages (Home, Login, Register, Dashboard)
│   │   └── main.jsx        # App entry point
│   ├── package.json
│   └── vite.config.js
│
└── server/                 # Express Backend API
    ├── middleware/         # Auth & validation middlewares
    ├── models/             # Mongoose schemas (User, Document)
    ├── routes/             # REST endpoints (auth, docs)
    ├── uploads/            # Temporary PDF file store
    ├── index.js            # Node app runner
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and a running instance of MongoDB (or a MongoDB Atlas URI connection).

### Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `server/` directory and configure the variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   MONGO_DB_USERNAME=your_username
   MONGO_DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_token
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Open a new terminal tab and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development hot reload server:
   ```bash
   npm run dev
   ```
4. Open the browser and visit `http://localhost:5173`.
