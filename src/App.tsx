import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientTestPage } from "./pages/ClientTestPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      {/* Biała belka – widoczna na każdym ekranie, bez logo */}
      <header className="top-bar">
        <span className="top-bar__name">AGNIESZKA KOTLONEK-WÓJCIK</span>
        <span className="top-bar__tagline">
          Świadomy biznes ma swoje korzenie w podświadomości.
        </span>
      </header>

      <Routes>
        {/* main path */}
        <Route path="/t/:publicToken" element={<ClientTestPage />} />

        {/* anything else */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
