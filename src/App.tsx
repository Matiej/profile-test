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
      <Navbar bg="light" className="mb-4">
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
              fontWeight: 650,
              textShadow: "0 2px 5px rgba(0,0,0,0.15)",
              letterSpacing: "0.8px",
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
