const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const messageFor = (status: number) => {
  const messages: Record<number, string> = {
    401: "Your session has expired. Please sign in again.",
    403: "You don’t have permission to do that.",
    404: "We couldn’t find that resource.",
    409: "That action conflicts with the current availability.",
    422: "Some information needs your attention.",
    429: "Too many requests. Please try again shortly.",
    500: "Our servers hit a problem. Please try again.",
  };
  return messages[status] || "We couldn’t complete that request.";
};

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("eventix_token");
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach Eventix. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    let message = messageFor(response.status);
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message || body.error || message;
    } catch {
      // Some gateway responses have no JSON body.
    }
    if (response.status === 401)
      window.dispatchEvent(new Event("eventix:unauthorized"));
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
