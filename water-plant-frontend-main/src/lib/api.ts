const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T = any>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${input}`, {
    ...init,
    credentials: "include", // VERY IMPORTANT
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "API error");
  }

  return res.json();
}
