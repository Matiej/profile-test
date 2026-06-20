# Profile Test (frontend)

Frontend testu „Profil świadomości finansowej" — aplikacja, w której klient
wypełnia test (pary stwierdzeń ocenianych na skali), a odpowiedzi trafiają do
backendu. Wejście do testu odbywa się przez link z tokenem:
`/t/<publicToken>`.

## Stack technologiczny

- **React 19** + **TypeScript** (`~5.9`)
- **Vite 7** — dev server, build i bundling
- **React Router DOM 7** — routing (`/t/:publicToken`)
- **React-Bootstrap 2** + **Bootstrap 5** — komponenty UI i style
- **clsx** — warunkowe klasy CSS
- **Vitest 4** + **Testing Library** (`@testing-library/react`,
  `user-event`, `jest-dom`) + **jsdom** — testy

## Wymagania

- **Node.js**: `20.19+` lub `22.12+` (wymóg Vite 7). Rekomendowane LTS 22 lub
  nowsze (projekt rozwijany na Node 24).
- **npm** `10+` (dostarczany z powyższymi wersjami Node).

Sprawdzenie wersji:

```bash
node -v
npm -v
```

## Konfiguracja środowiska

Zmienne środowiskowe (prefiks `VITE_`) trzymane są w plikach `.env`.
Skopiuj szablon i dostosuj:

```bash
cp .env.example .env.local
```

| Zmienna         | Domyślnie | Opis                                                        |
| --------------- | --------- | ----------------------------------------------------------- |
| `VITE_API_BASE` | `/api`    | Bazowy URL backendu. Lokalnie `/api` jest proxowane przez Vite na `http://localhost:8100` (patrz `vite.config.ts`). |

## Uruchomienie lokalne

1. Instalacja zależności:

   ```bash
   npm install
   ```

2. Dev server (HMR) na porcie **3210**:

   ```bash
   npm run dev
   ```

   Aplikacja: `http://localhost:3210/t/<publicToken>`
   (np. `http://localhost:3210/t/abc123`). Każda inna ścieżka → strona 404.

> Backend musi działać na `http://localhost:8100` (lub zmień `VITE_API_BASE`),
> bo żądania `/api/...` są tam proxowane.

## Build i podgląd produkcyjny

```bash
npm run build        # typecheck (tsc -b) + build produkcyjny
npm run build:dev    # build w trybie 'dev'
npm run build:prod   # build w trybie 'prod'
npm run preview      # lokalny podgląd zbudowanej aplikacji (z katalogu dist)
```

## Testy

```bash
npm test             # jednorazowe uruchomienie (vitest run)
npm run test:watch   # tryb watch (vitest)
```

Pojedynczy plik / wzorzec nazwy:

```bash
npx vitest run src/pages/ClientTestPage.test.tsx
npx vitest run -t "fallback"
```

Konfiguracja testów: blok `test` w `vite.config.ts`
(środowisko `jsdom`, globalne API, `setupFiles: ./src/test/setup.ts`).

## Lint i typy

```bash
npm run lint                          # ESLint
npx tsc -p tsconfig.app.json --noEmit # sprawdzenie typów bez emisji
```

## Struktura (skrót)

```
src/
  App.tsx                 # routing (/t/:publicToken)
  main.tsx                # punkt wejścia
  index.css               # style + zmienne brand
  lib/httpClient.ts       # fetch + ApiError
  pages/
    ClientTestPage.tsx    # główny ekran testu (welcome → demo → pytania → koniec)
    apiClientTest.ts      # wywołania API (getClientTest, submitClientTest)
    NotFoundPage.tsx
  types/ClientTestDto.ts  # typy DTO
  test/setup.ts           # setup Testing Library
```
