import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { ClientTestPage } from "./ClientTestPage";
import { getClientTest, submitClientTest } from "./apiClientTest";
import { ApiError } from "../lib/httpClient";
import type { ClientTestDto, ClientQuestionDto } from "../types/ClientTestDto";

// Mock warstwy API – bez sieci
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
    supportingStatement: `Wspierające ${i}`,
    limitingStatement: `Ograniczające ${i}`,
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

// klikanie kropek skali (Buttony bez dostępnej nazwy – po klasie)
function scaleCircles(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(".test-scale-circle")
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // deterministyczne ułożenie lewo/prawo (Math.random < 0.5 => supporting po lewej)
  vi.spyOn(Math, "random").mockReturnValue(0.1);
  submitClientTestMock.mockResolvedValue(undefined);
});

describe("ClientTestPage – stany brzegowe", () => {
  it("bez publicToken pokazuje NotFoundPage", async () => {
    renderAt(null);
    expect(
      await screen.findByText(/Strona nie została znaleziona/i)
    ).toBeInTheDocument();
    expect(getClientTestMock).not.toHaveBeenCalled();
  });

  it("przy ApiError 404 pokazuje NotFoundPage", async () => {
    getClientTestMock.mockRejectedValue(
      new ApiError({ status: 404, code: "NOT_FOUND", error: "x", message: "x" })
    );
    renderAt();
    expect(
      await screen.findByText(/Strona nie została znaleziona/i)
    ).toBeInTheDocument();
  });
});

describe("ClientTestPage – przepływ faz", () => {
  it("welcome → demo → pytanie", async () => {
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

describe("ClientTestPage – fallback opisów", () => {
  it("descriptionBefore z backendu zastępuje tekst zaszyty", async () => {
    getClientTestMock.mockResolvedValue(
      makeDto({ descriptionBefore: "Tekst z backendu PRZED" })
    );
    renderAt();
    expect(
      await screen.findByText("Tekst z backendu PRZED")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Przed Tobą/i)).not.toBeInTheDocument();
  });

  it("pusty descriptionBefore pokazuje tekst zaszyty (fallback)", async () => {
    getClientTestMock.mockResolvedValue(makeDto({ descriptionBefore: "  " }));
    renderAt();
    expect(await screen.findByText(/Przed Tobą/i)).toBeInTheDocument();
  });
});

describe("ClientTestPage – odpowiadanie i submit", () => {
  it("'Dalej' jest zablokowany dopóki nie wybrano odpowiedzi", async () => {
    getClientTestMock.mockResolvedValue(makeDto());
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    const next = screen.getByRole("button", { name: /^dalej$/i });
    expect(next).toBeDisabled();

    await user.click(scaleCircles(container)[2]);
    expect(next).toBeEnabled();
  });

  it("przejście do ostatniego pytania i wysłanie odpowiedzi", async () => {
    getClientTestMock.mockResolvedValue(
      makeDto({ descriptionAfter: "Dziękuję z backendu" })
    );
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    // pytanie 1
    await user.click(scaleCircles(container)[2]);
    await user.click(screen.getByRole("button", { name: /^dalej$/i }));

    // pytanie 2 (ostatnie)
    await screen.findByText(/Krok 2 z 2/i);
    await user.click(scaleCircles(container)[3]);

    const finish = screen.getByRole("button", { name: /zakończ test/i });
    await user.click(finish);

    await waitFor(() => expect(submitClientTestMock).toHaveBeenCalledTimes(1));
    const payload = submitClientTestMock.mock.calls[0][0];
    expect(payload.submissionId).toBe("sub-1");
    expect(payload.publicToken).toBe("tok-1");
    expect(payload.clientTestAnswers).toHaveLength(2);

    // ekran końcowy z opisem z backendu
    expect(await screen.findByText("Dziękuję z backendu")).toBeInTheDocument();
  });

  it("błąd submitu pokazuje komunikat i nie przechodzi do końca", async () => {
    getClientTestMock.mockResolvedValue(makeDto());
    submitClientTestMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    const { container } = renderAt();

    await screen.findByText(/Profil świadomości finansowej/i);
    await user.click(screen.getByRole("button", { name: /dalej/i }));
    await user.click(screen.getByRole("button", { name: /rozpocznij/i }));
    await screen.findByText(/Krok 1 z 2/i);

    await user.click(scaleCircles(container)[2]);
    await user.click(screen.getByRole("button", { name: /^dalej$/i }));
    await screen.findByText(/Krok 2 z 2/i);
    await user.click(scaleCircles(container)[3]);
    await user.click(screen.getByRole("button", { name: /zakończ test/i }));

    expect(
      await screen.findByText(/Nie udało się zapisać odpowiedzi/i)
    ).toBeInTheDocument();
    // nadal na karcie pytania, nie na ekranie podziękowania
    expect(within(document.body).queryByText(/Dziękuję/i)).not.toBeInTheDocument();
  });
});
