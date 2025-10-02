import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GridPage } from "./pages/GridPage";
import { WatchPage } from "./pages/WatchPage";
import { UploadPage } from "./pages/UploadPage";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" theme="light" />
      <Routes>
        <Route path="/" element={<GridPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/watch/:videoId" element={<WatchPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
