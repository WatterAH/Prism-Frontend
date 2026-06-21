import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import request from "../lib/request";
import {
  Exercise,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
  CHART_TYPE_LABEL,
} from "../types";

interface User {
  userId: number;
  username: string;
  role: string;
}

interface Props {
  navigate: (path: string) => void;
}

interface State {
  exercises: Exercise[];
  loading: boolean;
  deleteId: number | null;
  deleting: boolean;
}

export function DashboardPage() {
  const navigate = useNavigate();
  return <Dashboard navigate={navigate} />;
}

class Dashboard extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      exercises: [],
      loading: true,
      deleteId: null,
      deleting: false,
    };
  }

  // Lee el usuario almacenado en sessionStorage al iniciar sesión
  get user(): User | null {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  // Carga los ejercicios en cuanto el componente aparece en pantalla
  componentDidMount() {
    this.fetchExercises();
  }

  fetchExercises = async () => {
    try {
      this.setState({ loading: true });
      const exercises = await request.get<Exercise[]>("/api/exercises");
      this.setState({ exercises });
    } catch {
      toast.error("Error al cargar los ejercicios");
    } finally {
      this.setState({ loading: false });
    }
  };

  handleLogout = () => {
    // Elimina la sesión local y redirige al login
    sessionStorage.removeItem("user");
    this.props.navigate("/");
  };

  handleDeleteConfirm = async () => {
    const { deleteId } = this.state;
    if (!deleteId) return;
    try {
      this.setState({ deleting: true });
      // DELETE en cascada: el backend elimina también las exercise_options asociadas
      await request.delete(`/api/exercises/${deleteId}`);
      toast.success("Ejercicio eliminado");
      this.setState({ deleteId: null, deleting: false });
      this.fetchExercises();
    } catch {
      toast.error("Error al eliminar el ejercicio");
      this.setState({ deleting: false });
    }
  };

  render() {
    const { exercises, loading, deleteId, deleting } = this.state;

    return (
      <div
        style={{
          backgroundColor: "#f4f3f0",
          backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        {deleteId !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="card rounded-4 p-4" style={{ maxWidth: 320, width: "100%" }}>
              <p
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 600,
                  color: "#16140f",
                  marginBottom: 4,
                  fontSize: 15,
                }}
              >
                Alerta
              </p>
              <p style={{ color: "#737373", fontSize: 14, marginBottom: 20 }}>
                ¿Eliminar el siguiente ejercicio?
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dark btn-sm px-4"
                  onClick={this.handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? <span className="spinner-border spinner-border-sm" /> : "Sí"}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm px-4"
                  onClick={() => this.setState({ deleteId: null })}
                  disabled={deleting}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

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
                  {this.user?.username ?? "—"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={this.handleLogout}
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f4f3f0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={15} />
            Salir de la aplicación
          </button>
        </div>

        <div className="card rounded-4 px-4 pt-4 pb-3" style={{ backgroundColor: "#fff" }}>
          <div className="d-flex align-items-center justify-content-between mb-4">
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
                Gestión
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
                Crear, altas, bajas y cambios de ejercicios
              </h4>
            </div>
            <button
              onClick={() => this.props.navigate("/exercises/new")}
              className="btn btn-dark btn-sm d-flex align-items-center gap-2"
              style={{ fontSize: "13px", borderRadius: "8px", padding: "8px 14px" }}
            >
              <Plus size={14} />
              Crear ejercicio
            </button>
          </div>

          <table className="table" style={{ fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e8e8e8" }}>
                <th style={{ fontWeight: 500, color: "#737373", paddingBottom: "10px" }}>
                  Ejercicio
                </th>
                <th
                  style={{
                    fontWeight: 500,
                    color: "#737373",
                    paddingBottom: "10px",
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="text-center py-4">
                    <span className="spinner-border spinner-border-sm" style={{ color: "#737373" }} />
                  </td>
                </tr>
              ) : exercises.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-4" style={{ color: "#a3a3a3" }}>
                    No hay ejercicios registrados.
                  </td>
                </tr>
              ) : (
                exercises.map((ex) => {
                  const linkStyle: React.CSSProperties = {
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "13px",
                    color: "#16140f",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    textDecorationColor: "#d4d4d4",
                    cursor: "pointer",
                  };
                  const dangerLinkStyle: React.CSSProperties = {
                    ...linkStyle,
                    color: "#b91c1c",
                    textDecorationColor: "#fecaca",
                  };
                  const sepStyle: React.CSSProperties = {
                    color: "#d4d4d4",
                    fontSize: "12px",
                    userSelect: "none",
                  };
                  const diffColor = DIFFICULTY_COLOR[ex.difficulty];
                  return (
                    <tr key={ex.exerciseId} style={{ borderColor: "#f4f3f0" }}>
                      <td style={{ verticalAlign: "middle", color: "#16140f" }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span>{ex.title}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 999,
                              backgroundColor: diffColor.bg,
                              color: diffColor.fg,
                            }}
                          >
                            {DIFFICULTY_LABEL[ex.difficulty]}
                          </span>
                          {ex.chartType && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: 999,
                                backgroundColor: "#f4f3f0",
                                color: "#737373",
                              }}
                            >
                              {CHART_TYPE_LABEL[ex.chartType]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ verticalAlign: "middle" }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            style={linkStyle}
                            onClick={() => this.props.navigate(`/exercises/${ex.exerciseId}`)}
                          >
                            Ver ejercicio
                          </button>
                          <span style={sepStyle}>|</span>
                          <button
                            style={linkStyle}
                            onClick={() => this.props.navigate(`/exercises/${ex.exerciseId}/edit`)}
                          >
                            Modificar ejercicio
                          </button>
                          <span style={sepStyle}>|</span>
                          <button
                            style={dangerLinkStyle}
                            onClick={() => this.setState({ deleteId: ex.exerciseId! })}
                          >
                            Eliminar ejercicio
                          </button>
                          <span style={sepStyle}>|</span>
                          <button
                            style={linkStyle}
                            onClick={() => this.props.navigate(`/exercises/${ex.exerciseId}/probar`)}
                          >
                            Probar ejercicio
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
