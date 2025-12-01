import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getClientTest } from "./apiClientTest";
import type {
  ClientTestDto,
  PreparedQuestion,
  QuestionAnswer,
  AnswerValue,
} from "./../types/ClientTestDto";
import { ApiError } from "./../lib/httpClient";

import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import Container from "react-bootstrap/Container";
import clsx from "clsx";

type Phase = "intro" | "in-progress" | "finished";

const SCALE_OPTIONS: {
  value: AnswerValue;
  label: string;
  variant: string;
  color: string;
}[] = [
  {
    value: -2,
    label: "Zdecydowanie bardziej LEWY",
    variant: "danger",
    color: "#ef4444",
  },
  { value: -1, label: "Bardziej LEWY", variant: "warning", color: "#f97316" },
  { value: 0, label: "Pośrodku", variant: "secondary", color: "#64748b" },
  { value: 1, label: "Bardziej PRAWY", variant: "success", color: "#22c55e" },
  {
    value: 2,
    label: "Zdecydowanie bardziej PRAWY",
    variant: "primary",
    color: "#0ea5e9",
  },
];

export function ClientTestPage() {
  const { publicToken } = useParams<{ publicToken: string }>();

  const [rawData, setRawData] = useState<ClientTestDto | null>(null);
  const [questions, setQuestions] = useState<PreparedQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  //   const [loading, setLoading] = useState(true);

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = !rawData && !error && !notFound;

  // ---- pobieranie testu ----

  useEffect(() => {
    getClientTest(publicToken!)
      .then((res) => {
        setRawData(res);

        const prepared: PreparedQuestion[] = res.clientQuestions.map((q) => {
          const supportingOnLeft = Math.random() < 0.5;

          if (supportingOnLeft) {
            return {
              ...q,
              leftText: q.supportingStatement,
              rightText: q.limitingStatement,
              leftKind: "supporting",
              rightKind: "limiting",
            };
          } else {
            return {
              ...q,
              leftText: q.limitingStatement,
              rightText: q.supportingStatement,
              leftKind: "limiting",
              rightKind: "supporting",
            };
          }
        });

        setQuestions(prepared);
        setAnswers(
          prepared.map((q) => ({
            questionId: q.id,
            value: null,
            leftKind: q.leftKind,
            rightKind: q.rightKind,
          }))
        );
        setPhase("intro");
        setCurrentIndex(0);
      })
      .catch((err) => {
        if (
          err instanceof ApiError &&
          (err.status === 400 || err.status === 404)
        ) {
          setNotFound(true);
          return;
        }
        console.error(err);
        setError("Coś poszło nie tak przy pobieraniu testu.");
      });
  }, [publicToken]);

  const total = questions.length;
  const current = questions[currentIndex];

  const progressPercent = useMemo(() => {
    if (!total) return 0;
    const answeredCount = answers.filter((a) => a.value !== null).length;
    return Math.round((answeredCount / total) * 100);
  }, [answers, total]);

  const handleStart = () => setPhase("in-progress");

  const handleAnswerChange = (val: AnswerValue) => {
    if (!current) return;
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === current.id
          ? {
              ...a,
              value: val,
            }
          : a
      )
    );
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setPhase("finished");
      console.log("Answers ready to send:", answers);
      // tu później wyślemy POST
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  };

  // ==== ekrany specjalne ====

  if (isLoading) {
    return (
      <div className="test-shell d-flex align-items-center">
        <Container className="text-center">
          <Spinner animation="border" role="status" />
          <div className="mt-3">Ładuję test…</div>
        </Container>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="test-shell d-flex align-items-center">
        <Container className="text-center">
          <h1>Strona nie została znaleziona.</h1>
          <p>Wygląda na to, że niczego tutaj nie ma.</p>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-shell d-flex align-items-center">
        <Container>
          <Alert variant="danger">{error}</Alert>
        </Container>
      </div>
    );
  }

  if (!rawData || !total) {
    return null;
  }

  // ==== INTRO ====
  if (phase === "intro") {
    return (
      <div className="test-shell">
        <Container className="test-card">
          <Card className="test-question-card border-0">
            <Card.Body className="p-4 p-md-5 text-center">
              <h5 className="mb-3 text-muted">
                Agnieszka Kotlonek – Hipnoterapia w Biznesie
              </h5>
              <h2 className="mb-3">{rawData.testName}</h2>

              {/* stały tekst – tu Agutka może wkleić swój opis */}
              <p className="mb-3">
                Tutaj wchodzi stały tekst z instrukcją – spokojnie, bez złych
                odpowiedzi. Zaznaczasz to, co jest najbliżej Twojego odczucia.
              </p>

              {rawData.descriptionBefore && (
                <p className="text-muted mb-4">{rawData.descriptionBefore}</p>
              )}

              <p className="mb-4">
                Ten test składa się z <strong>{total}</strong> par stwierdzeń.
                Przy każdej z nich wybierzesz, czy bliżej Ci do tekstu po lewej,
                czy po prawej stronie.
              </p>

              <Button size="lg" onClick={handleStart}>
                Rozpocznij test
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ==== ZAKOŃCZENIE ====
  if (phase === "finished") {
    return (
      <div className="test-shell">
        <Container className="test-card">
          <Card className="test-question-card border-0">
            <Card.Body className="p-4 p-md-5 text-center">
              <h2>Dziękujemy za wypełnienie testu</h2>
              {rawData.descriptionAfter && (
                <p className="mt-3">{rawData.descriptionAfter}</p>
              )}
              <p className="mt-3 text-muted">
                Tutaj później pojawi się informacja, co dalej – np. kiedy
                otrzymasz wynik, link do konsultacji itd.
              </p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ==== EKRAN PYTANIA ====
  const currentAnswer = answers[currentIndex];
  const isCurrentAnswered = currentAnswer.value !== null;

  return (
    <div className="test-shell">
      <Container className="test-card">
        {/* Pasek postępu */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="small text-muted">{progressPercent}%</span>
            <span className="small text-muted">
              Krok {currentIndex + 1} z {total}
            </span>
          </div>
          <ProgressBar now={progressPercent} />
        </div>

        {/* Karta pytania */}
        <Card className="test-question-card border-0">
          <Card.Body className="p-4 p-md-5">
            <div className="d-flex flex-column flex-md-row gap-4 mt-2">
              <div className="flex-grow-1">
                <div className="fw-semibold fs-5">{current.leftText}</div>
              </div>

              <div className="flex-grow-1">
                <div className="fw-semibold fs-5">{current.rightText}</div>
              </div>
            </div>

            {/* Skala z kolorowymi kulkami – BEZ liczb */}
            <div className="mt-4 d-flex flex-column align-items-center">
              <div className="mb-2">
                Na ile bliżej Ci do lewej, a na ile do prawej?
              </div>

              <div className="d-flex gap-3 flex-wrap justify-content-center mb-2">
                {SCALE_OPTIONS.map((opt) => {
                  const isSelected = currentAnswer.value === opt.value;
                  const bg = isSelected ? opt.color : `${opt.color}20`;
                  const border = isSelected ? opt.color : `${opt.color}40`;

                  return (
                    <Button
                      key={opt.value}
                      variant="light"
                      className={clsx(
                        "test-scale-circle",
                        opt.value < 0 && "test-scale-circle--negative",
                        opt.value > 0 && "test-scale-circle--positive",
                        isSelected && "test-scale-circle--active"
                      )}
                      style={{
                        backgroundColor: bg,
                        border: `2px solid ${border}`,
                      }}
                      onClick={() => handleAnswerChange(opt.value)}
                    >
                      {/* wewnętrzna kropka */}
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "999px",
                          display: "block",
                          backgroundColor: isSelected
                            ? "white"
                            : `${opt.color}80`,
                        }}
                      />
                    </Button>
                  );
                })}
              </div>

              <div className="d-flex justify-content-between w-100 test-scale-labels">
                <span>Bliżej LEWEGO stwierdzenia</span>
                <span>Bliżej PRAWEGO stwierdzenia</span>
              </div>
            </div>

            {/* Nawigacja */}
            <div className="d-flex justify-content-between mt-4">
              <Button
                variant="outline-secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Wstecz
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isCurrentAnswered} // <-- blokada
              >
                {currentIndex === total - 1 ? "Zakończ test" : "Dalej"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
