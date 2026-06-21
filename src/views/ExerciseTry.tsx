import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { LogOut, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import request from "../lib/request";
import { Exercise, normalizeChartData } from "../types";
import { D3Chart } from "../components/ui/D3Chart";

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Convierte segundos totales al formato HH:MM:SS para mostrar en el cronómetro
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function ExerciseTryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  // IDs de las opciones que el alumno tiene actualmente seleccionadas
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [seconds, setSeconds] = useState(0);
  // Referencia al intervalo del cronómetro para poder limpiarlo al evaluar o reiniciar
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const user = getUser();

  useEffect(() => {
    request
      .get<Exercise>(`/api/exercises/${id}`)
      .then((ex) => {
        setExercise(ex);
        // Inicia el cronómetro en cuanto el ejercicio carga
        intervalRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);
      })
      .catch(() => toast.error("Error al cargar el ejercicio"))
      .finally(() => setLoading(false));

    // Limpia el intervalo si el componente se desmonta
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  const toggleSelect = (optionId: number) => {
    if (result !== null || !exercise) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (exercise.questionType === "SINGLE_CHOICE") {
        // Opción única: reemplaza cualquier selección anterior
        return new Set([optionId]);
      }
      // Opción múltiple: alterna la selección de la opción
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const handleEvaluar = () => {
    if (!exercise || selectedIds.size === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Compara el conjunto de IDs correctos con el conjunto seleccionado por el alumno
    const correctIds = new Set(
      exercise.options.filter((o) => o.correct).map((o) => o.optionId!),
    );
    const sameSize = correctIds.size === selectedIds.size;
    const allMatch = [...correctIds].every((id) => selectedIds.has(id));
    setResult(sameSize && allMatch ? "correct" : "incorrect");
  };

  const handleReset = () => {
    setSelectedIds(new Set());
    setResult(null);
    setSeconds(0);
    // Reinicia el cronómetro desde cero
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const chartData = exercise
    ? normalizeChartData(exercise.chartDataJson)
    : null;

  return (
    <div
      style={{
        backgroundColor: "#f4f3f0",
        backgroundImage:
          "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div
        className="card rounded-4 px-4 py-3 d-flex flex-row align-items-center justify-content-between mb-4"
        style={{ backgroundColor: "#fff" }}
      >
        <div className="d-flex align-items-center gap-3">
          <Logo />
          <div>
            <h3
              className="mb-0"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#16140f",
              }}
            >
              Prism
            </h3>
            <p className="mb-0" style={{ fontSize: "13px", color: "#737373" }}>
              Bienvenido,{" "}
              <span style={{ fontWeight: 500, color: "#16140f" }}>
                {user?.username ?? "—"}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="d-flex align-items-center gap-2"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            color: "#737373",
            padding: "6px 10px",
            borderRadius: "8px",
          }}
        >
          <LogOut size={15} />
          Salir de la aplicación
        </button>
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="d-flex align-items-center gap-1 mb-3"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          color: "#737373",
          padding: 0,
        }}
      >
        <ChevronLeft size={16} />
        Volver al dashboard
      </button>

      {loading ? (
        <div className="text-center py-5">
          <span className="spinner-border" style={{ color: "#737373" }} />
        </div>
      ) : !exercise ? (
        <div
          className="card rounded-4 p-4 text-center"
          style={{ backgroundColor: "#fff" }}
        >
          <p style={{ color: "#737373", marginBottom: 12 }}>
            Ejercicio no encontrado.
          </p>
          <button
            className="btn btn-dark btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            Volver al dashboard
          </button>
        </div>
      ) : (
        <div
          className="card rounded-4 overflow-hidden"
          style={{ backgroundColor: "#fff" }}
        >
          <div
            className="text-center px-4 py-3"
            style={{ borderBottom: "1px solid #e8e8e8" }}
          >
            <h5
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: "#16140f",
                margin: 0,
                fontSize: 18,
              }}
            >
              {exercise.title}
            </h5>
          </div>

          <div
            className="text-center py-2"
            style={{
              backgroundColor: "#f9f9f9",
              borderBottom: "1px solid #e8e8e8",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#737373",
                textTransform: "uppercase",
              }}
            >
              EJERCICIO
            </span>
          </div>

          <div className="d-flex flex-wrap" style={{ minHeight: 240 }}>
            <div
              className="flex-grow-1 p-4"
              style={{
                borderRight:
                  chartData && exercise.chartType
                    ? "1px solid #e8e8e8"
                    : "none",
                minWidth: 280,
              }}
            >
              {exercise.instructions && (
                <p style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>
                  {exercise.instructions}
                </p>
              )}

              {exercise.mediaType && exercise.mediaPath && (
                <div className="mb-3">
                  {exercise.mediaType === "IMAGE" && (
                    <img
                      src={exercise.mediaPath}
                      alt="Media del ejercicio"
                      style={{
                        maxWidth: "100%",
                        borderRadius: 6,
                        maxHeight: 200,
                      }}
                    />
                  )}
                  {exercise.mediaType === "VIDEO" && (
                    <video
                      src={exercise.mediaPath}
                      controls
                      style={{
                        maxWidth: "100%",
                        borderRadius: 6,
                        maxHeight: 200,
                      }}
                    />
                  )}
                  {exercise.mediaType === "AUDIO" && (
                    <audio
                      src={exercise.mediaPath}
                      controls
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
              )}

              <div className="d-flex flex-column gap-2">
                {exercise.options.map((opt) => {
                  const optId = opt.optionId!;
                  const isSelected = selectedIds.has(optId);
                  const isEvaluated = result !== null;
                  const isCorrect = opt.correct;

                  let bgColor = "#fafafa";
                  let borderColor = "#e8e8e8";
                  if (isEvaluated && isCorrect) {
                    bgColor = "#f0fdf4";
                    borderColor = "#bbf7d0";
                  } else if (isEvaluated && isSelected && !isCorrect) {
                    bgColor = "#fff5f5";
                    borderColor = "#fecaca";
                  }

                  return (
                    <label
                      key={optId}
                      className="d-flex align-items-center gap-3"
                      style={{
                        cursor: isEvaluated ? "default" : "pointer",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${
                          isSelected && !isEvaluated ? "#16140f" : borderColor
                        }`,
                        backgroundColor:
                          isSelected && !isEvaluated ? "#fafafa" : bgColor,
                      }}
                    >
                      <input
                        type={
                          exercise.questionType === "SINGLE_CHOICE"
                            ? "radio"
                            : "checkbox"
                        }
                        name="exercise-option"
                        checked={isSelected}
                        onChange={() => toggleSelect(optId)}
                        disabled={isEvaluated}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: isEvaluated ? "default" : "pointer",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          color:
                            isEvaluated && isCorrect
                              ? "#16803c"
                              : isEvaluated && isSelected && !isCorrect
                                ? "#dc2626"
                                : "#16140f",
                          fontWeight:
                            isEvaluated &&
                            (isCorrect || (isSelected && !isCorrect))
                              ? 600
                              : 400,
                        }}
                      >
                        {opt.text}
                      </span>
                    </label>
                  );
                })}
              </div>

              {result !== null && exercise.explanation && (
                <div
                  className="mt-3"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1e40af",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 4,
                    }}
                  >
                    Explicación
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#1e3a8a", marginBottom: 0 }}
                  >
                    {exercise.explanation}
                  </p>
                </div>
              )}
            </div>

            {chartData && exercise.chartType && (
              <div
                className="d-flex flex-column align-items-center justify-content-center p-4"
                style={{ minWidth: 380, borderLeft: "1px solid #e8e8e8" }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "#a3a3a3",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  GRÁFICA
                </span>
                <D3Chart
                  type={exercise.chartType}
                  data={chartData}
                  title={exercise.chartTitle}
                  xLabel={exercise.xAxisLabel}
                  yLabel={exercise.yAxisLabel}
                  primaryColor={exercise.primaryColor}
                  secondaryColor={exercise.secondaryColor}
                  width={360}
                  height={280}
                />
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: "2px solid #e8e8e8",
              backgroundColor: "#f9f9f9",
              padding: "16px 24px",
            }}
          >
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span style={{ fontSize: 13, fontWeight: 700, color: "#16140f" }}>
                EVALUACIÓN:
              </span>
              <button
                className="btn btn-dark btn-sm px-3"
                style={{ borderRadius: 6, fontSize: 13 }}
                onClick={handleEvaluar}
                disabled={selectedIds.size === 0 || result !== null}
              >
                Evaluar
              </button>
              {result !== null && (
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  style={{ borderRadius: 6, fontSize: 13 }}
                  onClick={handleReset}
                >
                  Reintentar
                </button>
              )}

              <span style={{ fontSize: 13, fontWeight: 700, color: "#16140f" }}>
                RESULTADO:
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    result === "correct"
                      ? "#16803c"
                      : result === "incorrect"
                        ? "#dc2626"
                        : "#a3a3a3",
                  border: "1px solid #e8e8e8",
                  borderRadius: 6,
                  padding: "4px 14px",
                  backgroundColor: "#fff",
                  minWidth: 110,
                  textAlign: "center",
                }}
              >
                {result === "correct"
                  ? "VERDADERO"
                  : result === "incorrect"
                    ? "FALSO"
                    : "—"}
              </span>

              <span style={{ fontSize: 13, fontWeight: 700, color: "#16140f" }}>
                TIEMPO:
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#16140f",
                  border: "1px solid #e8e8e8",
                  borderRadius: 6,
                  padding: "4px 14px",
                  backgroundColor: "#fff",
                }}
              >
                {formatTime(seconds)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
