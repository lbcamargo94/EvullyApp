/** Error shape shared by IPC and, in Phase 2, the HTTP API (README §5.5). */
export interface ApiError {
  code: string;
  message: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
