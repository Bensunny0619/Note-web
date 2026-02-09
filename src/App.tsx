import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { AudioProvider } from './contexts/AudioContext';
import { LabelProvider } from './contexts/LabelContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotesPage from './pages/notes/NotesPage';
import CreateNote from './pages/notes/CreateNote';
import EditNote from './pages/notes/EditNote';
import ArchivePage from './pages/notes/ArchivePage';
import TrashPage from './pages/notes/TrashPage';
import LabelsPage from './pages/notes/LabelsPage';
import RemindersPage from './pages/notes/RemindersPage';
import SettingsPage from './pages/notes/SettingsPage';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import './index.css';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public Route wrapper (redirect to home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return token ? <Navigate to="/" replace /> : <>{children}</>;
}

import Layout from './components/Layout';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route path="/" element={<ProtectedRoute><Layout><NotesPage /></Layout></ProtectedRoute>} />
            <Route path="/notes/create" element={<ProtectedRoute><Layout><CreateNote /></Layout></ProtectedRoute>} />
            <Route path="/notes/edit/:id" element={<ProtectedRoute><Layout><EditNote /></Layout></ProtectedRoute>} />
            <Route path="/archive" element={<ProtectedRoute><Layout><ArchivePage /></Layout></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><Layout><TrashPage /></Layout></ProtectedRoute>} />
            <Route path="/labels" element={<ProtectedRoute><Layout><LabelsPage /></Layout></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><Layout><RemindersPage /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
            <Route path="/privacy" element={<ProtectedRoute><Layout><PrivacyPolicy /></Layout></ProtectedRoute>} />
            <Route path="/terms" element={<ProtectedRoute><Layout><TermsOfService /></Layout></ProtectedRoute>} />
        </Routes>
    );
}

import ReminderNotification from './components/ReminderNotification';

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <NetworkProvider>
                        <AudioProvider>
                            <LabelProvider>
                                <ReminderNotification />
                                <AppRoutes />
                            </LabelProvider>
                        </AudioProvider>
                    </NetworkProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
