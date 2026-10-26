import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { TreeProvider } from './context/TreeContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { IdentifySpeciesPage } from './pages/IdentifySpeciesPage';
import { TreeTrackerPage } from './pages/TreeTrackerPage';
import { SoilTipsPage } from './pages/SoilTipsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { PublicTreePage } from './pages/PublicTreePage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canopy ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0E1210] text-[#EDECE8] p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 mx-auto flex items-center justify-center text-xl">
              🌿
            </div>
            <h2 className="text-xl font-serif text-white">Something interrupted the page view</h2>
            <p className="text-xs text-stone-400">
              An unexpected render error occurred. Click below to reload Canopy safely.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Reload Canopy
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <TreeProvider>
              <BrowserRouter>
                <Routes>
                  {/* Standalone public, scannable field verification route — accessible without login */}
                  <Route path="tree/:tree_id" element={<PublicTreePage />} />

                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="identify" element={<IdentifySpeciesPage />} />
                    <Route path="soil-tips" element={<SoilTipsPage />} />
                    <Route path="tree-tracker" element={<TreeTrackerPage />} />
                    <Route path="campaigns" element={<CampaignsPage />} />
                    <Route path="campaigns/:id" element={<CampaignDetailPage />} />
                    <Route path="species-guide" element={<Navigate to="/identify?tab=conditions" replace />} />
                    <Route path="photo-recognition" element={<Navigate to="/identify?tab=photo" replace />} />
                    <Route path="my-trees" element={<Navigate to="/tree-tracker?filter=my-trees" replace />} />
                    <Route path="reports" element={<Navigate to="/tree-tracker" replace />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </TreeProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
