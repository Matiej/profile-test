import { http } from './../lib/httpClient';
import type { ClientTestDto, ClientTestSubmissionPayload } from './../types/ClientTestDto';

export function getClientTest(publicToken: string) {
    return http.fetchJSON<ClientTestDto>(`/client/test/${publicToken}`);
}

export function submitClientTest(payload: ClientTestSubmissionPayload) {
  return http.fetchJSON<void>(`/client/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}