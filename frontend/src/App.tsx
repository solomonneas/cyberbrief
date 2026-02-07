import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { VariantPicker } from './pages/VariantPicker';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { AttackPage } from './pages/AttackPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocsPage } from './pages/DocsPage';
import { Variant1 } from './variants/Variant1';
import { Variant2 } from './variants/Variant2';
import { Variant3 } from './variants/Variant3';
import { Variant4 } from './variants/Variant4';
import { Variant5 } from './variants/Variant5';

const VARIANT_SHELLS: Record<string, React.FC> = {
  '1': Variant1,
  '2': Variant2,
  '3': Variant3,
  '4': Variant4,
  '5': Variant5,
};

const variantRoutes = (
  <>
    <Route path="home" element={<HomePage />} />
    <Route path="report/:reportId" element={<ReportPage />} />
    <Route path="attack" element={<AttackPage />} />
    <Route path="history" element={<HistoryPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="docs" element={<DocsPage />} />
    <Route index element={<Navigate to="home" replace />} />
  </>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root — Variant Picker */}
        <Route path="/" element={<VariantPicker />} />

        {/* Variant Shells */}
        {Object.entries(VARIANT_SHELLS).map(([id, Shell]) => (
          <Route key={id} path={`/${id}`} element={<Shell />}>
            {variantRoutes}
          </Route>
        ))}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
