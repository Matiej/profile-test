import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getClientTest, submitClientTest } from "./apiClientTest";
import type {
  ClientTestDto,
  PreparedQuestion,
  QuestionAnswer,
  AnswerValue,
  ClientTestSubmissionPayload,
} from "./../types/ClientTestDto";
import { ApiError } from "./../lib/httpClient";

import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";
import Container from "react-bootstrap/Container";
import clsx from "clsx";
import type { ClientTestAnswer } from "../types/ClientTestDto";
import { NotFoundPage } from "./NotFoundPage";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

type Phase = "welcome" | "demo" | "in-progress" | "finished";

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
    color: "#ef4444", // mocny czerwony
  },
  {
    value: -1,
    label: "Bardziej LEWY",
    variant: "danger",
    color: "#fecaca", // jasny czerwony
  },
  {
    value: 0,
    label: "Pośrodku",
    variant: "secondary",
    color: "#64748b", // szary – zostaje
  },
  {
    value: 1,
    label: "Bardziej PRAWY",
    variant: "primary",
    color: "#bfdbfe", // jasny niebieski
  },
  {
    value: 2,
    label: "Zdecydowanie bardziej PRAWY",
    variant: "primary",
    color: "#0ea5e9", // mocny niebieski
  },
];

export function ClientTestPage() {
  const { publicToken } = useParams<{ publicToken: string }>();

  const [rawData, setRawData] = useState<ClientTestDto | null>(null);
  const [questions, setQuestions] = useState<PreparedQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoading = !rawData && !error && !notFound;

  // ---- pobieranie testu ----

  useEffect(() => {
    if (!publicToken) {
      setNotFound(true);
      return;
    }

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
          prepared.map((preparedQuestion) => ({
            statementKey: preparedQuestion.statementKey,
            value: null,
          }))
        );
        setPhase("welcome");
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
  const currentQuestion = questions[currentIndex];

  const progressPercent = useMemo(() => {
    if (!total) return 0;
    const answeredCount = answers.filter((a) => a.value !== null).length;
    return Math.round((answeredCount / total) * 100);
  }, [answers, total]);

  const handleGoToDemo = () => setPhase("demo");

  const handleStart = () => {
    setCurrentIndex(0);
    setPhase("in-progress");
  };

  const handleAnswerChange = (val: AnswerValue) => {
    if (!currentQuestion) return;
    setAnswers((prev) =>
      prev.map((a) =>
        a.statementKey === currentQuestion.statementKey
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
      <div className="test-shell test-shell--mist d-flex align-items-center">
        <Container className="text-center">
          <Spinner animation="border" role="status" />
          <div className="mt-3">Ładuję test…</div>
        </Container>
      </div>
    );
  }

  if (notFound) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <div className="test-shell test-shell--mist d-flex align-items-center">
        <Container>
          <Alert variant="danger">{error}</Alert>
        </Container>
      </div>
    );
  }

  if (!rawData || !total) {
    return null;
  }

  // ==== POWITANIE ====
  if (phase === "welcome") {
    return (
      <div className="test-shell test-shell--clouds">
        <Container className="test-card test-card--narrow">
          <Card className="test-info-card border-0">
            <Card.Body className="test-info-card__body">
              <h2 className="test-section-title text-center">
                Profil świadomości finansowej
              </h2>

              <p className="test-lead-gap">
                Przed Tobą {total} par stwierdzeń o pieniądzach
                i biznesie. Przy każdej parze wybierz zdanie, które opisuje, jak
                myślisz i zachowujesz się na co dzień. Niektóre pary mogą wydać
                Ci się podobne - to zamierzone, wybieraj mimo to.
              </p>

              <p className="mb-0">
                <strong>Zaufaj pierwszej myśli.</strong> Wypełnienie zajmie
                około 20–25 minut.
              </p>
            </Card.Body>
          </Card>

          <div className="text-center test-cta">
            <Button size="lg" onClick={handleGoToDemo}>
              DALEJ
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // ==== DEMO – statyczny podgląd „jak to działa” ====
  if (phase === "demo") {
    return (
      <div className="test-shell test-shell--mist">
        <Container className="test-card">
          <h4 className="text-center mb-4">
            Zanim zaczniesz, zobacz jak to działa.
          </h4>

          {/* Atrapa karty pytania – w pełni statyczna, nieklikalna */}
          <div className="test-demo" aria-hidden="true">
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">1%</span>
                <span className="small text-muted">Krok 2 z {total}</span>
              </div>
              <ProgressBar now={1} />
            </div>

            <Card className="test-question-card border-0">
              <Card.Body className="p-4 p-md-5">
                <Row className="mt-2 align-items-start">
                  <Col md={6} className="text-start">
                    <div className="fw-semibold fs-5">
                      Zaczynam dzień od planu.
                    </div>
                  </Col>
                  <Col md={6} className="text-end">
                    <div className="fw-semibold fs-5">
                      Zaczynam dzień od kawy, a potem zobaczymy.
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 d-flex flex-column align-items-center">
                  <div className="d-flex gap-3 flex-wrap justify-content-center mb-2">
                    {SCALE_OPTIONS.map((opt) => {
                      const isSelected = opt.value === 0;
                      const bg = isSelected ? opt.color : `${opt.color}20`;
                      const border = isSelected ? opt.color : `${opt.color}40`;

                      return (
                        <span
                          key={opt.value}
                          className="test-scale-circle"
                          style={{
                            backgroundColor: bg,
                            border: `2px solid ${border}`,
                          }}
                        >
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
                        </span>
                      );
                    })}
                  </div>

                  <div className="d-flex justify-content-between w-100 test-scale-labels">
                    <span>Bliżej LEWEGO stwierdzenia</span>
                    <span>Bliżej PRAWEGO stwierdzenia</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" disabled>
                    Wstecz
                  </Button>
                  <Button variant="primary" disabled>
                    Dalej
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="text-center mt-4">
            <Button size="lg" onClick={handleStart}>
              ROZPOCZNIJ
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // ==== ZAKOŃCZENIE ====
  if (phase === "finished") {
    return (
      <div className="test-shell test-shell--clouds">
        <Container className="test-card test-card--narrow">
          <Card className="test-info-card border-0">
            <Card.Body className="test-info-card__body">
              <h2 className="test-section-title text-center">
                Profil świadomości finansowej
              </h2>

              <p className="mb-3">
                <strong>Dziękuję, że mi zaufałaś.</strong>
              </p>

              <p className="mb-3">
                Wypełnienie tego profilu wymaga odwagi i szczerości wobec siebie
                i właśnie to zrobiłaś.
              </p>

              <p className="mb-3">
                Twoje odpowiedzi są teraz u mnie. W ciągu 48 godzin
                przeanalizuję je i wyślę Ci wynik na adres e-mail, który
                podałaś.
              </p>

              <p className="mb-0">Agnieszka Kotlonek-Wójcik</p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ==== EKRAN PYTANIA ====
  const currentAnswer = answers.find(
    (a) => a.statementKey === currentQuestion?.statementKey
  );

  const isCurrentAnswered = currentAnswer?.value !== null;

  function toScoring(value: AnswerValue): number {
    return value;
  }

  const limitingOnLeft = currentQuestion.leftKind === "limiting";
  const scaleOptions = limitingOnLeft
    ? SCALE_OPTIONS
    : [...SCALE_OPTIONS].reverse();

  const handleFinish = async () => {
    if (!rawData) return;

    // kontrolnie: wszystkie odpowiedzi muszą być
    const allAnswered = answers.every((a) => a.value !== null);
    if (!allAnswered) {
      // opcjonalnie pokaż komunikat, że coś pominęli
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const clientTestAnswers: ClientTestAnswer[] = questions.map((q) => {
        const ans = answers.find((a) => a.statementKey === q.statementKey);
        const val = ans?.value ?? 0;

        return {
          statementKey: q.statementKey,
          scoring: toScoring(val as AnswerValue),
        };
      });

      const payload: ClientTestSubmissionPayload = {
        submissionId: rawData.submissionId,
        publicToken: rawData.publicToken,
        clientTestAnswers: clientTestAnswers,
      };

      await submitClientTest(payload);
      setPhase("finished");
    } catch (e) {
      console.error(e);
      setError("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="test-shell test-shell--mist">
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
            <Row className="mt-2 align-items-start">
              <Col md={6} className="text-start">
                <div className="fw-semibold fs-5">
                  {currentQuestion.leftText}
                </div>
              </Col>
              <Col md={6} className="text-end">
                <div className="fw-semibold fs-5">
                  {currentQuestion.rightText}
                </div>
              </Col>
            </Row>

            {/* Skala z kolorowymi kulkami – BEZ liczb */}
            <div className="mt-4 d-flex flex-column align-items-center">
              <div className="d-flex gap-3 flex-wrap justify-content-center mb-2">
                {scaleOptions.map((opt) => {
                  const isSelected = currentAnswer?.value === opt.value;
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
                onClick={currentIndex === total - 1 ? handleFinish : handleNext}
                disabled={!isCurrentAnswered || submitting}
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
