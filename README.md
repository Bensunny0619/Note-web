# NoteApp Web - React Web Application

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Professional offline-first note-taking web application built with React, TypeScript, and TailwindCSS. **Connects to the same Laravel backend and MySQL database as the mobile app** for seamless cross-platform synchronization.

## 🚀 Features

- **🔐 Authentication**: Secure login and registration
- **📴 Offline-First**: IndexedDB storage with sync queue
- **🌓 Dark Mode**: Beautiful dark/light theme with persistence
- **🔄 Real-Time Sync**: Cross-device synchronization (coming soon)
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **⚡ Fast**: Built with Vite for lightning-fast development

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State**: React Context API
- **Storage**: IndexedDB (idb)
- **API**: Axios
- **Backend**: Laravel (shared with mobile app)

## 📋 Prerequisites

- Node.js (LTS version)
- Running Laravel backend at `http://localhost:8000`
- MySQL database (shared with mobile app)

## 🔧 Installation

```bash
# Navigate to the project directory
cd Note-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── contexts/          # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── NetworkContext.tsx
│   ├── AudioContext.tsx
│   └── LabelContext.tsx
├── services/          # Core business logic
│   ├── api.ts
│   ├── authStorage.ts
│   ├── config.ts
│   ├── offlineApi.ts
│   └── storage.ts
├── pages/             # Route components
│   ├── auth/
│   ├── notes/
│   └── ...
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## 🔗 Backend Connection

This web app connects to the **same Laravel backend** as the mobile app:

- **API Base URL**: `http://localhost:8000/api`
- **Database**: Shared MySQL database
- **Authentication**: JWT tokens
- **Endpoints**: Same API endpoints as mobile app

### Configuring Backend URL

Edit `src/services/config.ts`:

```typescript
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api', // Change for production
    REVERB_HOST: 'localhost',
    TIMEOUT: 60000,
};
```

## 📝 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 Theme

The app supports dark and light modes:
- Toggle via Settings page (coming soon)
- Preference stored in localStorage
- Respects system preference by default

## 🔐 Authentication

1. Navigate to `http://localhost:5173`
2. You'll be redirected to `/login`
3. Register a new account or login
4. Access protected routes after authentication

## 📊 Current Status

### ✅ Completed
- Project setup and configuration
- Core services (API, storage, offline API)
- Context providers (Auth, Theme, Network, Audio, Labels)
- Routing with protected routes
- Authentication pages (Login, Register)
- Placeholder pages for all routes

### 🚧 In Progress
- Full notes list implementation
- Note editor (create/edit)
- UI components (NoteCard, DrawingCanvas, AudioRecorder)
- Sync queue processor
- Feature pages (Archive, Trash, Labels, etc.)

## 🤝 Contributing

This is a companion web app to the React Native mobile app. Both apps share the same backend and database.

## 📄 License

Private project

## 👨‍💻 Developer

Built with ❤️ by **Gbenga Odudare Emmanuel**

---

**Note**: This is the web version of the NoteApp. For the mobile version, see the `Note-app` directory.
