import { Container } from "react-bootstrap";

export function NotFoundPage() {
  return (
    <div className="test-shell test-shell--mist d-flex align-items-start">
      <Container className="text-center mt-3">
        <h1>Nie znaleźliśmy tej strony</h1>
        <p className="mb-2">
          Coś poszło nie tak albo tej strony już nie ma. Nic straconego — jeśli
          masz pytania, chętnie pomogę.
        </p>
        <p className="mb-0">
          Napisz do mnie:{" "}
          <a className="test-contact-link" href="mailto:kontakt@agnieszkakotlonek.pl">
            kontakt@agnieszkakotlonek.pl
          </a>
        </p>
      </Container>
    </div>
  );
}
