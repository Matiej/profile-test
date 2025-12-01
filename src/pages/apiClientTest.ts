import { http } from './../lib/httpClient';
import type { ClientTestDto } from './../types/ClientTestDto';

export function getClientTest(publicToken: string) {
    return http.fetchJSON<ClientTestDto>(`/client/test/${publicToken}`);
}