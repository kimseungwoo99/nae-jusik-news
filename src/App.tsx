import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useFontSize } from "./hooks/useFontSize";
import { AllNewsPage } from "./pages/AllNewsPage";
import { HomePage } from "./pages/HomePage";
import { SavedNewsPage } from "./pages/SavedNewsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StockPage } from "./pages/StockPage";

export function App() {
  useFontSize();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="all" element={<AllNewsPage />} />
        <Route path="stock/:stockId" element={<StockPage />} />
        <Route path="saved" element={<SavedNewsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
