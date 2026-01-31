// This is the generic API fetch wrapper. It automatically attempts to refresh the access token on 401/403 errors and retries the original request once. Use this for all API calls.
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T = any>(
  input: string,
  init?: RequestInit,
  retry = true // allow one retry after refresh
): Promise<T> {
  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = init?.body instanceof FormData;
  
  const res = await fetch(`${BASE_URL}${input}`, {
    ...init,
    credentials: "include", // VERY IMPORTANT
    headers: {
      // Only set Content-Type if not FormData
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    // Try to refresh token if not already retried
    if (retry && input !== "/auth/refresh" && input !== "/auth/login") {
      try {
        await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        // Retry the original request once
        return apiFetch(input, init, false);
      } catch {
        // Refresh failed, fall through to error
      }
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "API error");
  }

  return res.json();
}
