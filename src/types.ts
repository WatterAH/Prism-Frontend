// Tipos union que replican los enums del backend (se persisten como strings en MySQL)
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ChartType = "BAR" | "LINE" | "PIE" | "DONUT" | "AREA";
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO";

// Una opción de respuesta dentro de un ejercicio
export interface ExerciseOption {
  optionId?: number;
  optionOrder: number;    // posición en la lista (1-based)
  text: string;
  correct: boolean;       // si es la(s) respuesta(s) correcta(s)
}

// Entidad principal: refleja exactamente la tabla "exercises" del backend
export interface Exercise {
  exerciseId?: number;
  title: string;
  instructions: string;
  explanation: string | null;       // texto que se muestra al alumno tras evaluar
  questionType: QuestionType;
  difficulty: Difficulty;
  mediaType: MediaType | null;      // tipo de archivo adjunto (si existe)
  mediaPath: string | null;         // URL del archivo adjunto
  chartType: ChartType | null;      // tipo de gráfica (si existe)
  chartTitle: string | null;
  xAxisLabel: string | null;
  yAxisLabel: string | null;
  chartDataJson: string | null;     // JSON string: [{"label":"...", "value": 0}, ...]
  primaryColor: string;             // color HEX para la paleta de la gráfica
  secondaryColor: string;
  options: ExerciseOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  userId: number;
  username: string;
  password: string;
}

// Punto de datos normalizado para D3Chart
export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Convierte el JSON almacenado en chartDataJson al formato ChartPoint[] que usa D3Chart.
 * Detecta automáticamente qué campo es la etiqueta (string) y cuál es el valor (number),
 * por lo que es tolerante a distintos nombres de clave en el JSON.
 * Devuelve null si el JSON está vacío, mal formado, o no contiene datos válidos.
 */
export function normalizeChartData(
  raw: string | null | undefined,
): ChartPoint[] | null {
  if (!raw) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const sample = parsed[0];
  if (!sample || typeof sample !== "object") return null;

  // Detecta la clave de etiqueta (primer campo de tipo string) y la de valor (primer número)
  const labelKey = Object.keys(sample).find(
    (k) => typeof sample[k] === "string",
  );
  const valueKey = Object.keys(sample).find(
    (k) => typeof sample[k] === "number",
  );
  if (!labelKey || !valueKey) return null;

  return parsed
    .map((item) => ({
      label: String(item[labelKey]),
      value: Number(item[valueKey]),
    }))
    .filter((p) => !isNaN(p.value));
}

// Etiquetas legibles para mostrar en badges y selects
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Medio",
  HARD: "Difícil",
};

// Colores de fondo y texto para los badges de dificultad (verde/amarillo/rojo)
export const DIFFICULTY_COLOR: Record<Difficulty, { bg: string; fg: string }> = {
  EASY: { bg: "#dcfce7", fg: "#15803d" },
  MEDIUM: { bg: "#fef3c7", fg: "#a16207" },
  HARD: { bg: "#fee2e2", fg: "#b91c1c" },
};

export const CHART_TYPE_LABEL: Record<ChartType, string> = {
  BAR: "Barras",
  LINE: "Líneas",
  PIE: "Pastel",
  DONUT: "Dona",
  AREA: "Área",
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Una respuesta",
  MULTIPLE_CHOICE: "Múltiples respuestas",
};

/**
 * Genera una paleta de n colores interpolando linealmente entre primary y secondary en RGB.
 * D3Chart la usa para asignar un color distinto a cada barra o segmento de la gráfica.
 */
export function interpolateColors(
  primary: string,
  secondary: string,
  n: number,
): string[] {
  if (n <= 0) return [];
  if (n === 1) return [primary];
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  const [r1, g1, b1] = parse(primary);
  const [r2, g2, b2] = parse(secondary);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);   // t = 0 en el primer color, t = 1 en el último
    const r = r1 + (r2 - r1) * t;
    const g = g1 + (g2 - g1) * t;
    const b = b1 + (b2 - b1) * t;
    out.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
  }
  return out;
}
