import { Container } from "react-bootstrap";

export function NotFoundPage() {
  return (
    <div className="test-shell d-flex align-items-start">
      <Container className="text-center mt-3">
        <h1>Strona nie została znaleziona.</h1>
        <p>Wygląda na to, że niczego tutaj nie ma.</p>
      </Container>
    </div>
  );
}
