import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { ClientTestPage } from "./ClientTestPage";
import { getClientTest, submitClientTest } from "./apiClientTest";
import { ApiError } from "../lib/httpClient";
import type { ClientTestDto, ClientQuestionDto } from "../types/ClientTestDto";

// Mock the API layer – no network
vi.mock("./apiClientTest", () => ({
  getClientTest: vi.fn(),
  submitClientTest: vi.fn(),
}));

const getClientTestMock = getClientTest as unknown as Mock;
const submitClientTestMock = submitClientTest as unknown as Mock;

function makeQuestion(i: number): ClientQuestionDto {
  return {
    id: `id-${i}`,
    statementKey: `key-${i}`,
    statementCategory: "cat",
    supportingStatement: `Supporting ${i}`,
    limitingStatement: `Limiting ${i}`,
  };
}

function makeDto(overrides: Partial<ClientTestDto> = {}): ClientTestDto {
  return {
    testName: "Test",
    descriptionBefore: "",
    descriptionAfter: "",
    publicToken: "tok-1",
    submissionId: "sub-1",
    clientQuestions: [makeQuestion(1), makeQuestion(2)],
    ...overrides,
  };
}

function renderAt(token: string | null = "tok-1") {
  const path = token === null ? "/" : `/t/${token}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/t/:publicToken" element={<ClientTestPage />} />
        <Route path="/" element={<ClientTestPage />} />
      </Routes>
    </MemoryRouter>
  );
}

// click scale circles (Buttons without an accessible name – select by class)
function scaleCircles(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(".test-scale-circle")
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // deterministic left/right layout (Math.random < 0.5 => supporting on the left)
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  submitClientTestMock.mockResolvedValue(undefined);
});

describe("ClientTestPage – edge cases", () => {
  it("shows NotFoundPage when publicToken is missing", async () => {
    renderAt(null);
    expect(
      await screen.findByText(/Nie znaleźliśmy tej strony/i)
    ).toBeInTheDocument();
    expect(getClientTestMock).not.toHaveBeenCalled();
  });

  it("shows NotFoundPage on ApiError 404", async () => {
    getClientTestMock.mockRejectedValue(
      new ApiError({ status: 404, code: "NOT_FOUND", error: "x", message: "x" })
    );
    renderAt();
    expect(
      await screen.findByText(/Nie znaleźliśmy tej strony/i)
    ).toBeInTheDocument();
  });
});

describe("ClientTestPage – phase flow", () => {
  it("welcome → demo → question", async () => {
    getClientTestMock.mockResolvedValue(makeDto());
    const user = userEvent.setup();
    renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);

    await user.click(screen.getByRole("button", { name: /dalej/i }));
    expect(await screen.findByText(/Zanim zaczniesz/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    expect(await screen.findByText(/Krok 1 z 2/i)).toBeInTheDocument();
  });
});

describe("ClientTestPage – description fallback", () => {
  it("descriptionBefore from backend replaces the hardcoded text", async () => {
    getClientTestMock.mockResolvedValue(
      makeDto({ descriptionBefore: "Tekst z backendu PRZED" })
    );
    renderAt();
    expect(
      await screen.findByText("Tekst z backendu PRZED")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Przed Tobą/i)).not.toBeInTheDocument();
  });

  it("empty descriptionBefore shows the hardcoded text (fallback)", async () => {
    getClientTestMock.mockResolvedValue(makeDto({ descriptionBefore: "  " }));
    renderAt();
    expect(await screen.findByText(/Przed Tobą/i)).toBeInTheDocument();
  });
});

describe("ClientTestPage – answering and submit", () => {
  it("'Dalej' is disabled until an answer is selected; clicking a circle advances to the next question", async () => {
    getClientTestMock.mockResolvedValue(makeDto());
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    expect(screen.getByRole("button", { name: /^dalej$/i })).toBeDisabled();

    // click circle → auto-advance to the next statement
    await user.click(scaleCircles(container)[2]);
    expect(await screen.findByText(/Krok 2 z 2/i)).toBeInTheDocument();
  });

  it("advances to the last question and submits the answers", async () => {
    getClientTestMock.mockResolvedValue(
      makeDto({ descriptionAfter: "Dziękuję z backendu" })
    );
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    // question 1 → clicking a circle auto-advances to question 2
    await user.click(scaleCircles(container)[2]);

    // question 2 (last) – no auto-advance, "Zakończ test" remains
    await screen.findByText(/Krok 2 z 2/i);
    await user.click(scaleCircles(container)[3]);

    const finish = screen.getByRole("button", { name: /zakończ test/i });
    await user.click(finish);

    await waitFor(() => expect(submitClientTestMock).toHaveBeenCalledTimes(1));
    const payload = submitClientTestMock.mock.calls[0][0];
    expect(payload.submissionId).toBe("sub-1");
    expect(payload.publicToken).toBe("tok-1");
    expect(payload.clientTestAnswers).toHaveLength(2);

    // finish screen with backend description
    expect(await screen.findByText("Dziękuję z backendu")).toBeInTheDocument();
  });

  it("submit error shows a message and does not advance to the finish screen", async () => {
    getClientTestMock.mockResolvedValue(makeDto());
    submitClientTestMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    await user.click(scaleCircles(container)[2]);
    await screen.findByText(/Krok 2 z 2/i);
    await user.click(scaleCircles(container)[3]);
    await user.click(screen.getByRole("button", { name: /zakończ test/i }));

    expect(
      await screen.findByText(/Nie udało się zapisać odpowiedzi/i)
    ).toBeInTheDocument();
    // still on the question card, not the thank-you screen
    expect(within(document.body).queryByText(/Dziękuję/i)).not.toBeInTheDocument();
  });
});
