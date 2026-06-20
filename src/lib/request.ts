interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

const BASE_URL = process.env.NODE_ENV === "production" ? "/PrismBackend" : "";

async function parseResponse<T>(res: Response, url: string, method: string): Promise<T> {
  let raw: string;
  try {
    raw = await res.text();
  } catch {
    raw = "";
  }

  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    console.error(`[request] ${method} ${url} → ${res.status} (respuesta no es JSON):`, raw.slice(0, 500));
    throw new ApiError(
      `El servidor respondió ${res.status} ${res.statusText || ""}`.trim(),
      res.status,
    );
  }

  if (!res.ok || (data && data.success === false)) {
    const msg =
      (data && (data.message || data.error)) ||
      `${res.status} ${res.statusText || "Error"}`;
    console.error(`[request] ${method} ${url} → ${res.status}:`, data);
    throw new ApiError(msg, res.status);
  }

  if (data && typeof data === "object" && "data" in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
}

class Request {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(BASE_URL + url);
    return parseResponse<T>(res, url, "GET");
  }

  async post<T>(url: string, body: any, formDataContent?: boolean): Promise<T> {
    const res = await fetch(BASE_URL + url, {
      method: "POST",
      headers: formDataContent ? {} : { "Content-Type": "application/json" },
      credentials: "include",
      body: formDataContent ? body : JSON.stringify(body),
    });
    return parseResponse<T>(res, url, "POST");
  }

  async put<T>(url: string, body: any, formDataContent?: boolean): Promise<T> {
    const res = await fetch(BASE_URL + url, {
      method: "PUT",
      headers: formDataContent ? {} : { "Content-Type": "application/json" },
      body: formDataContent ? body : JSON.stringify(body),
    });
    return parseResponse<T>(res, url, "PUT");
  }

  async delete<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(BASE_URL + url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(res, url, "DELETE");
  }
}

const request = new Request();

export default request;
