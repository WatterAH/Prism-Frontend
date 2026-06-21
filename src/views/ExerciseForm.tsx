import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { LogOut, ChevronLeft, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import request, { ApiError } from "../lib/request";
import {
  Exercise,
  ExerciseOption,
  ChartType,
  Difficulty,
  QuestionType,
  MediaType,
  CHART_TYPE_LABEL,
  DIFFICULTY_LABEL,
  QUESTION_TYPE_LABEL,
  normalizeChartData,
} from "../types";
import { D3Chart } from "../components/ui/D3Chart";

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Plantilla de ejercicio vacío con los valores por defecto que muestra el formulario al crear
function emptyExercise(): Exercise {
  return {
    title: "",
    instructions: "",
    explanation: null,
    questionType: "SINGLE_CHOICE",
    difficulty: "MEDIUM",
    mediaType: null,
    mediaPath: null,
    chartType: null,
    chartTitle: null,
    xAxisLabel: null,
    yAxisLabel: null,
    chartDataJson: null,
    primaryColor: "#16140f",
    secondaryColor: "#737373",
    options: [
      { optionOrder: 1, text: "", correct: false },
      { optionOrder: 2, text: "", correct: false },
    ],
  };
}

/*
 * Vista dual: funciona tanto para CREAR (/exercises/new) como para EDITAR (/exercises/:id/edit).
 * La diferencia se detecta por la presencia del parámetro :id en la URL (isEdit).
 */
export function ExerciseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [ex, setEx] = useState<Exercise>(emptyExercise());
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isEdit) return;
    // En modo edición carga el ejercicio existente y mezcla con el template vacío
    // para garantizar que todos los campos tengan un valor por defecto
    request
      .get<Exercise>(`/api/exercises/${id}`)
      .then((data) => {
        setEx({
          ...emptyExercise(),
          ...data,
          options: data.options?.length
            ? data.options
            : emptyExercise().options,
        });
      })
      .catch(() => toast.error("Error al cargar el ejercicio"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Helper tipado para actualizar un campo del ejercicio sin mutar el estado
  const set = <K extends keyof Exercise>(key: K, value: Exercise[K]) =>
    setEx((p) => ({ ...p, [key]: value }));

  const updateOption = (index: number, patch: Partial<ExerciseOption>) =>
    setEx((p) => ({
      ...p,
      options: p.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));

  // Límite máximo de 10 opciones por ejercicio
  const addOption = () =>
    setEx((p) =>
      p.options.length >= 10
        ? p
        : {
            ...p,
            options: [
              ...p.options,
              { optionOrder: p.options.length + 1, text: "", correct: false },
            ],
          },
    );

  // Mínimo 2 opciones; no permite eliminar por debajo de ese umbral
  const removeOption = (index: number) =>
    setEx((p) => {
      if (p.options.length <= 2) return p;
      return { ...p, options: p.options.filter((_, i) => i !== index) };
    });

  const toggleCorrect = (index: number) => {
    setEx((p) => {
      if (p.questionType === "SINGLE_CHOICE") {
        // SINGLE_CHOICE: marcar una opción desmarca automáticamente las demás
        return {
          ...p,
          options: p.options.map((o, i) => ({ ...o, correct: i === index })),
        };
      }
      // MULTIPLE_CHOICE: alterna la selección de forma independiente
      return {
        ...p,
        options: p.options.map((o, i) =>
          i === index ? { ...o, correct: !o.correct } : o,
        ),
      };
    });
  };

  const handleQuestionTypeChange = (qt: QuestionType) => {
    setEx((p) => {
      if (qt === "SINGLE_CHOICE") {
        // Al cambiar a SINGLE_CHOICE, mantiene solo la primera opción correcta
        const firstCorrect = p.options.findIndex((o) => o.correct);
        return {
          ...p,
          questionType: qt,
          options: p.options.map((o, i) => ({
            ...o,
            correct: i === firstCorrect,
          })),
        };
      }
      return { ...p, questionType: qt };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación en frontend (el backend también valida, esto da feedback inmediato)
    if (!ex.options.some((o) => o.correct)) {
      toast.error("Debe haber al menos una opción correcta");
      return;
    }
    if (ex.chartType && ex.chartDataJson) {
      try {
        JSON.parse(ex.chartDataJson);
      } catch {
        toast.error("El JSON de la gráfica no es válido");
        return;
      }
    }
    const payload: Exercise = {
      ...ex,
      // Si no hay mediaType seleccionado, limpia la ruta para no enviar datos huérfanos
      mediaPath: ex.mediaType ? ex.mediaPath : null,
      chartType: ex.chartType,
      // Si no hay chartType, no envía datos de gráfica al backend
      chartDataJson: ex.chartType ? ex.chartDataJson : null,
      options: ex.options.map((o, i) => ({ ...o, optionOrder: i + 1 })),
    };
    try {
      setSubmitting(true);
      if (isEdit) {
        await request.put<Exercise>(`/api/exercises/${id}`, payload);
        toast.success("Ejercicio actualizado");
      } else {
        await request.post<Exercise>("/api/exercises", payload);
        toast.success("Ejercicio creado");
      }
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Error al guardar el ejercicio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const previewData = ex.chartType
    ? normalizeChartData(ex.chartDataJson)
    : null;
  const sectionTitle: React.CSSProperties = {
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: "#16140f",
    marginBottom: 4,
    marginTop: 8,
  };
  const fieldLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#737373",
  };

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

      <div className="row g-4">
        <div className="col-lg-7">
          <div
            className="card rounded-4 px-4 pt-4 pb-4"
            style={{ backgroundColor: "#fff" }}
          >
            <div className="d-flex align-items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <ChevronLeft size={20} color="#737373" />
              </button>
              <div>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    color: "#a3a3a3",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Ejercicios
                </p>
                <h4
                  className="mb-0"
                  style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "#16140f",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isEdit ? "Modificar ejercicio" : "Crear nuevo ejercicio"}
                </h4>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <span className="spinner-border" style={{ color: "#737373" }} />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="d-flex flex-column gap-3"
              >
                <p style={sectionTitle}>General</p>

                <div>
                  <label className="form-label mb-1" style={fieldLabel}>
                    Título *
                  </label>
                  <input
                    className="form-control"
                    style={{ fontSize: 14 }}
                    value={ex.title}
                    onChange={(e) => set("title", e.target.value)}
                    required
                    placeholder="Ej. Distribución de frecuencias"
                  />
                </div>

                <div>
                  <label className="form-label mb-1" style={fieldLabel}>
                    Instrucciones *
                  </label>
                  <textarea
                    className="form-control"
                    style={{ fontSize: 14 }}
                    value={ex.instructions}
                    onChange={(e) => set("instructions", e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe el contexto o pregunta del ejercicio..."
                  />
                </div>

                <div className="row g-2">
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Tipo de pregunta
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: 14 }}
                      value={ex.questionType}
                      onChange={(e) =>
                        handleQuestionTypeChange(e.target.value as QuestionType)
                      }
                    >
                      {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {QUESTION_TYPE_LABEL[t]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Dificultad
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: 14 }}
                      value={ex.difficulty}
                      onChange={(e) =>
                        set("difficulty", e.target.value as Difficulty)
                      }
                    >
                      {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {DIFFICULTY_LABEL[t]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <hr style={{ borderColor: "#e8e8e8", margin: "8px 0 0 0" }} />

                <div className="d-flex align-items-center justify-content-between">
                  <p style={sectionTitle} className="mb-0">
                    Opciones de respuesta
                  </p>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={ex.options.length >= 10}
                    className="d-flex align-items-center gap-1"
                    style={{
                      background: "none",
                      border: "1px dashed #d4d4d4",
                      cursor:
                        ex.options.length >= 10 ? "not-allowed" : "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      borderRadius: 6,
                      color: "#16140f",
                    }}
                  >
                    <Plus size={12} /> Agregar opción
                  </button>
                </div>

                <p style={{ fontSize: 11, color: "#a3a3a3", marginBottom: 0 }}>
                  {ex.questionType === "SINGLE_CHOICE"
                    ? "Marca la opción correcta (solo una)."
                    : "Marca todas las opciones correctas."}
                </p>

                {ex.options.map((opt, i) => (
                  <div key={i} className="d-flex align-items-center gap-2">
                    <input
                      type={
                        ex.questionType === "SINGLE_CHOICE"
                          ? "radio"
                          : "checkbox"
                      }
                      checked={opt.correct}
                      onChange={() => toggleCorrect(i)}
                      style={{
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    />
                    <input
                      className="form-control"
                      style={{ fontSize: 14 }}
                      value={opt.text}
                      onChange={(e) =>
                        updateOption(i, { text: e.target.value })
                      }
                      placeholder={`Opción ${i + 1}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={ex.options.length <= 2}
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          ex.options.length <= 2 ? "not-allowed" : "pointer",
                        color: ex.options.length <= 2 ? "#d4d4d4" : "#dc2626",
                        padding: 4,
                      }}
                      title="Eliminar opción"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div>
                  <label className="form-label mb-1" style={fieldLabel}>
                    Explicación (opcional, se muestra al evaluar)
                  </label>
                  <textarea
                    className="form-control"
                    style={{ fontSize: 14 }}
                    value={ex.explanation ?? ""}
                    onChange={(e) => set("explanation", e.target.value || null)}
                    rows={2}
                    placeholder="Explica por qué la respuesta correcta es la correcta..."
                  />
                </div>

                <hr style={{ borderColor: "#e8e8e8", margin: "8px 0 0 0" }} />
                <p style={sectionTitle}>Gráfica</p>

                <div className="row g-2">
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Tipo de gráfica
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: 14 }}
                      value={ex.chartType ?? ""}
                      onChange={(e) =>
                        set(
                          "chartType",
                          (e.target.value || null) as ChartType | null,
                        )
                      }
                    >
                      <option value="">Sin gráfica</option>
                      {(Object.keys(CHART_TYPE_LABEL) as ChartType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {CHART_TYPE_LABEL[t]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Título de la gráfica
                    </label>
                    <input
                      className="form-control"
                      style={{ fontSize: 14 }}
                      value={ex.chartTitle ?? ""}
                      onChange={(e) =>
                        set("chartTitle", e.target.value || null)
                      }
                      disabled={!ex.chartType}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                {ex.chartType &&
                  ex.chartType !== "PIE" &&
                  ex.chartType !== "DONUT" && (
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <label className="form-label mb-1" style={fieldLabel}>
                          Etiqueta eje X
                        </label>
                        <input
                          className="form-control"
                          style={{ fontSize: 14 }}
                          value={ex.xAxisLabel ?? ""}
                          onChange={(e) =>
                            set("xAxisLabel", e.target.value || null)
                          }
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label mb-1" style={fieldLabel}>
                          Etiqueta eje Y
                        </label>
                        <input
                          className="form-control"
                          style={{ fontSize: 14 }}
                          value={ex.yAxisLabel ?? ""}
                          onChange={(e) =>
                            set("yAxisLabel", e.target.value || null)
                          }
                        />
                      </div>
                    </div>
                  )}

                <div className="row g-2">
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Color primario
                    </label>
                    <div className="d-flex gap-2 align-items-center">
                      <input
                        type="color"
                        value={ex.primaryColor}
                        onChange={(e) => set("primaryColor", e.target.value)}
                        style={{
                          width: 40,
                          height: 38,
                          border: "1px solid #e8e8e8",
                          borderRadius: 6,
                          padding: 2,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        className="form-control"
                        style={{ fontSize: 13, fontFamily: "monospace" }}
                        value={ex.primaryColor}
                        onChange={(e) => set("primaryColor", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Color secundario
                    </label>
                    <div className="d-flex gap-2 align-items-center">
                      <input
                        type="color"
                        value={ex.secondaryColor}
                        onChange={(e) => set("secondaryColor", e.target.value)}
                        style={{
                          width: 40,
                          height: 38,
                          border: "1px solid #e8e8e8",
                          borderRadius: 6,
                          padding: 2,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        className="form-control"
                        style={{ fontSize: 13, fontFamily: "monospace" }}
                        value={ex.secondaryColor}
                        onChange={(e) => set("secondaryColor", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {ex.chartType && (
                  <div>
                    <label className="form-label mb-1" style={fieldLabel}>
                      Datos (JSON)
                    </label>
                    <textarea
                      className="form-control"
                      value={ex.chartDataJson ?? ""}
                      onChange={(e) =>
                        set("chartDataJson", e.target.value || null)
                      }
                      rows={4}
                      placeholder='[{"label":"A","value":12},{"label":"B","value":8}]'
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    />
                    <p
                      className="mt-1 mb-0"
                      style={{ fontSize: 11, color: "#a3a3a3" }}
                    >
                      Array de objetos: un campo de texto (etiqueta) y uno
                      numérico (valor).
                    </p>
                  </div>
                )}

                <hr style={{ borderColor: "#e8e8e8", margin: "8px 0 0 0" }} />
                <p style={sectionTitle}>Multimedia</p>

                <div className="row g-2">
                  <div className="col-sm-5">
                    <label className="form-label mb-1" style={fieldLabel}>
                      Tipo
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: 14 }}
                      value={ex.mediaType ?? ""}
                      onChange={(e) =>
                        set(
                          "mediaType",
                          (e.target.value || null) as MediaType | null,
                        )
                      }
                    >
                      <option value="">Ninguno</option>
                      <option value="IMAGE">Imagen (JPG/PNG)</option>
                      <option value="VIDEO">Video (MP4)</option>
                      <option value="AUDIO">Audio (MP3)</option>
                    </select>
                  </div>
                  <div className="col-sm-7">
                    <label className="form-label mb-1" style={fieldLabel}>
                      URL
                    </label>
                    <input
                      className="form-control"
                      style={{ fontSize: 14 }}
                      value={ex.mediaPath ?? ""}
                      onChange={(e) => set("mediaPath", e.target.value || null)}
                      disabled={!ex.mediaType}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn btn-dark btn-sm px-4"
                    disabled={submitting}
                    style={{ borderRadius: 8 }}
                  >
                    {submitting ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : isEdit ? (
                      "Guardar cambios"
                    ) : (
                      "Crear ejercicio"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-4"
                    onClick={() => navigate("/dashboard")}
                    style={{ borderRadius: 8 }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div
            className="card rounded-4 px-4 pt-4 pb-4 sticky-top"
            style={{ backgroundColor: "#fff", top: 24 }}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <Eye size={16} color="#737373" />
              <p
                className="mb-0"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  color: "#a3a3a3",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Vista previa
              </p>
            </div>
            {ex.chartType && previewData ? (
              <div className="d-flex justify-content-center">
                <D3Chart
                  type={ex.chartType}
                  data={previewData}
                  title={ex.chartTitle}
                  xLabel={ex.xAxisLabel}
                  yLabel={ex.yAxisLabel}
                  primaryColor={ex.primaryColor}
                  secondaryColor={ex.secondaryColor}
                  width={400}
                  height={300}
                />
              </div>
            ) : (
              <div
                className="text-center py-5"
                style={{
                  border: "1px dashed #e8e8e8",
                  borderRadius: 12,
                  color: "#a3a3a3",
                  fontSize: 13,
                }}
              >
                {ex.chartType
                  ? "Agrega datos en formato JSON para ver la gráfica"
                  : "Selecciona un tipo de gráfica para ver la vista previa"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
