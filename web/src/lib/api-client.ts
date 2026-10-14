export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

type Options = {
  method?: string;
  json?: unknown;
};

export async function api<T>(url: string, { method, json }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "server");
  return data as T;
}
