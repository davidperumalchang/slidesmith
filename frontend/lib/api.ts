import type {
  AuthUser,
  LookupResponse,
  LyricsPreviewResponse,
  Pastor,
  SermonPreviewResponse,
  Slide,
  ValidateResponse,
  VerseExtractResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend-api";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  const next = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();
  if (next && next !== "/") params.set("next", next);
  window.location.assign(`/login${params.size ? `?${params}` : ""}`);
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) {
      if (Array.isArray(data.details) && data.details.length > 0) {
        const detail = data.details
          .map((d: { path?: string; message: string }) =>
            d.path ? `${d.path}: ${d.message}` : d.message,
          )
          .join("; ");
        return `${data.error} (${detail})`;
      }
      return data.error;
    }
  } catch {
    /* fall through */
  }
  return `Request failed with status ${res.status}`;
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    redirectToLogin();
  }

  return res;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await json<{ user: AuthUser }>(res);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    /* still clear client navigation */
  }
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await apiFetch("/auth/me");
  if (res.status === 401) return null;
  const data = await json<{ user: AuthUser }>(res);
  return data.user;
}

// ---------------------------------------------------------------------------
// App API
// ---------------------------------------------------------------------------
export async function getPastors(): Promise<Pastor[]> {
  const res = await apiFetch("/pastors");
  const data = await json<{ pastors: Pastor[] }>(res);
  return data.pastors;
}

export async function extractVerses(file: File): Promise<VerseExtractResponse> {
  const form = new FormData();
  form.append("document", file);
  const res = await apiFetch("/verses/extract", {
    method: "POST",
    body: form,
  });
  return json<VerseExtractResponse>(res);
}

export async function lookupPassages(params: {
  references?: string[];
  text?: string;
  source?: "offline" | "online";
  version?: string;
}): Promise<LookupResponse> {
  const res = await apiFetch("/passages/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return json<LookupResponse>(res);
}

export async function validateLyrics(content: string): Promise<ValidateResponse> {
  const res = await apiFetch("/lyrics/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return json<ValidateResponse>(res);
}

export async function previewLyrics(
  content: string,
  format: "ppt" | "pp7",
  useTheme = false,
): Promise<LyricsPreviewResponse> {
  const res = await apiFetch("/lyrics/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, format, useTheme }),
  });
  return json<LyricsPreviewResponse>(res);
}

export async function previewSermon(params: {
  slides: Slide[];
  format: "ppt" | "pp7";
  pastorId?: number;
  sermonTitle?: string;
  useTheme?: boolean;
}): Promise<SermonPreviewResponse> {
  const res = await apiFetch("/sermon/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return json<SermonPreviewResponse>(res);
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------
function filenameFromResponse(res: Response, fallback: string): string {
  const xName = res.headers.get("X-Filename");
  if (xName) {
    try {
      return decodeURIComponent(xName);
    } catch {
      /* ignore */
    }
  }
  const disp = res.headers.get("Content-Disposition") ?? "";
  const utf8 = disp.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* ignore */
    }
  }
  const plain = disp.match(/filename="?([^";]+)"?/i);
  if (plain) return plain[1];
  return fallback;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function download(path: string, body: unknown, fallbackName: string): Promise<string> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const blob = await res.blob();
  const filename = filenameFromResponse(res, fallbackName);
  triggerBrowserDownload(blob, filename);
  return filename;
}

export function generateLyricsPptx(content: string): Promise<string> {
  return download("/generate/lyrics-ppt", { content }, "lyrics.pptx");
}

export function generateLyricsPp7(content: string, useTheme: boolean): Promise<string> {
  return download("/generate/lyrics-pp7", { content, useTheme }, "lyrics.pro");
}

export function generateSermonPptx(params: {
  slides: Slide[];
  pastorId?: number;
  sermonTitle?: string;
}): Promise<string> {
  return download("/generate/sermon-ppt", params, "sermon_ppt.pptx");
}

export function generateSermonPp7(params: {
  slides: Slide[];
  pastorId?: number;
  useTheme: boolean;
}): Promise<string> {
  return download("/generate/sermon-pp7", params, "Sermon.pro");
}

export { API_BASE_URL };
