import { BrowserRouter, Routes, Route } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { ClientTestPage } from "./pages/ClientTestPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    // DEV: bez basename. W PROD ustawimy basename="/pt"
    <BrowserRouter>
      <Navbar bg="light" className="mb-4">
        <Container>
          <Navbar.Brand>
            Agnieszka Kotlonek Hipnoterapia w Biznesie
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
