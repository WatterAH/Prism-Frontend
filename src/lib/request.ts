// Estructura estándar de todas las respuestas del backend Spring Boot
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

// Error personalizado que incluye el código HTTP para que las vistas puedan reaccionar al 401
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// En producción el backend está desplegado bajo /PrismBackend en Tomcat;
// en desarrollo el proxy de webpack lo resuelve sin prefijo.
const BASE_URL = process.env.NODE_ENV === "production" ? "/PrismBackend" : "";

/**
 * Lee la respuesta HTTP y la convierte al tipo esperado.
 * Primero lee como texto para evitar errores si el servidor devuelve HTML en lugar de JSON.
 * Lanza ApiError con el mensaje del backend si success === false o si el status no es 2xx.
 */
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
    // El servidor devolvió algo que no es JSON (p.ej. página de error de Tomcat)
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

  // Desempaqueta el campo "data" de la respuesta estándar del backend
  if (data && typeof data === "object" && "data" in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
}

// Cliente HTTP centralizado; todas las vistas usan esta instancia para hablar con el backend
class Request {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(BASE_URL + url);
    return parseResponse<T>(res, url, "GET");
  }

  // formDataContent = true envía FormData en lugar de JSON (para subida de archivos)
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
