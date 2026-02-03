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
import ArchivePage from './pages/ArchivePage';
import TrashPage from './pages/TrashPage';
import LabelsPage from './pages/LabelsPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
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

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            <Route path="/" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/notes/create" element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
            <Route path="/notes/edit/:id" element={<ProtectedRoute><EditNote /></ProtectedRoute>} />
            <Route path="/archive" element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
            <Route path="/labels" element={<ProtectedRoute><LabelsPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <NetworkProvider>
                        <AudioProvider>
                            <LabelProvider>
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
