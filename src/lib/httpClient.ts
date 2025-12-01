const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export type BackendErrorResponse = {
    timestamp: string;
    status: number;
    error: string;
    code: string;
    message: string;
    path: string;
    details?: Record<string, unknown> | null;
};

export class ApiError extends Error {
    status: number;
    code: string;
    error: string;
    path?: string;
    details?: Record<string, unknown> | null;
    raw?: unknown;

    constructor(init: {
        status: number;
        code: string;
        error: string;
        message: string;
        path?: string;
        details?: Record<string, unknown> | null;
        raw?: unknown;
    }) {
        super(init.message);
        this.name = "ApiError";
        this.status = init.status;
        this.code = init.code;
        this.error = init.error;
        this.path = init.path;
        this.details = init.details ?? null;
        this.raw = init.raw;
    }
}

export async function fetchJSON<T = unknown>(
    input: string,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(`${API_BASE}${input}`, {
        credentials: "include",
        ...init,
        headers: {
            Accept: "application/json",
            ...(init?.headers || {}),
        },
    });

    let text = "";
    try {
        text = await res.text();
    } catch {
        // ignore
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any = null;
    if (text) {
        try {
            json = JSON.parse(text);
        } catch {
            // ignore
        }
    }

    if (!res.ok) {
        if (
            json &&
            typeof json === "object" &&
            "status" in json &&
            "code" in json
        ) {
            const errResp = json as BackendErrorResponse;
            throw new ApiError({
                status: errResp.status,
                code: errResp.code ?? "UNKNOWN_ERROR",
                error: errResp.error ?? "Error",
                message: errResp.message ?? "Request failed",
                path: errResp.path ?? input,
                details: errResp.details ?? null,
                raw: errResp,
            });
        }

        throw new ApiError({
            status: res.status,
            code: "HTTP_ERROR",
            error: res.statusText || "HTTP Error",
            message:
                (json && json.message) ||
                (text && !json ? text : res.statusText || "Request failed"),
            path: input,
            details: null,
            raw: json ?? text,
        });
    }

    if (!text) {
        return undefined as T;
    }

    if (json !== null) {
        return json as T;
    }

    return text as unknown as T;
}

export const http = { fetchJSON };