import { BrowserRouter, Routes, Route } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";
import { ClientTestPage } from "./pages/ClientTestPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    // DEV: bez basename. W PROD ustawimy basename="/pt"
    <BrowserRouter>
      <Navbar
        className="mb-4"
        style={{
          backgroundColor: "var(--brand-cloud)",
          borderBottom: "1px solid var(--brand-mist)",
        }}
      >
        <Container className="d-flex flex-column align-items-center py-3">
          <Link
            to="https://agnieszkakotlonek.pl/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/logo.png"
              alt="Agnieszka Kotlonek – Hipnoterapia w Biznesie"
              style={{ height: 110, width: "auto", display: "block" }}
            />
          </Link>

          <Navbar.Brand
            className="mt-2 text-center"
            style={{
              fontWeight: 600,
              color: "var(--brand-ink)",
              letterSpacing: "0.5px",
            }}
          >
            Agnieszka Kotlonek – Hipnoterapia w Biznesie
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          {/* main path */}
          <Route path="/t/:publicToken" element={<ClientTestPage />} />

          {/* anything else */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
