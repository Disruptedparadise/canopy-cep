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

export default function App() {
  return (
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
                  <Route path="reports" element={<Navigate to="/dashboard" replace />} />
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
  );
}
