import React from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/background.png";
import { Input } from "../components/ui/Input";
import { KeyRound, MoveRight, UserRound } from "lucide-react";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/ui/Logo";
import request, { ApiError } from "../lib/request";
import { toast } from "sonner";

interface Props {
  onSuccess: (user: any) => void;
}

interface State {
  loading: boolean;
  form: {
    user: string;
    password: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const handleSuccess = (user: any) => {
    sessionStorage.setItem("user", JSON.stringify(user));
    navigate("/dashboard");
  };
  return <Login onSuccess={handleSuccess} />;
}

class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      form: { user: "", password: "" },
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      form: {
        ...prevState.form,
        [name]: value,
      },
    }));
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      this.setState({ loading: true });
      const user = await request.post("/api/auth/login", {
        username: this.state.form.user,
        password: this.state.form.password,
      });
      this.props.onSuccess(user);
    } catch (error: any) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Error al iniciar sesión");
      }
      this.setState({ form: { user: "", password: "" } });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <>
        <style>{`
          #login-view { align-items: center; padding-left: 0; }
          @media (min-width: 768px) {
            #login-view { align-items: flex-start; padding-left: 18%; }
            #login-card { margin-left: 0 !important; margin-right: 0 !important; }
          }
        `}</style>
      <div
        id="login-view"
        className="container-fluid d-flex flex-column justify-content-center w-100 vh-100"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          id="login-card"
          className="card rounded-4 px-3 pt-3 pb-0 mx-3"
          style={{
            maxWidth: "380px",
            width: "100%",
            backgroundColor: "#fff",
          }}
        >
          <div className="card-body">
            <div className="d-flex gap-3 mb-4">
              <Logo />
              <div>
                <h3
                  className="mb-0"
                  style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: "23px",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "#16140f",
                  }}
                >
                  Prism
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "14px",
                    color: "#737373",
                  }}
                >
                  Análisis y Diseño de Sistemas
                </p>
              </div>
            </div>
            <form
              onSubmit={this.handleSubmit}
              className="d-flex flex-column gap-3 mt-4"
            >
              <div className="d-flex flex-column gap-1">
                <Label htmlFor="user">Usuario</Label>
                <Input
                  value={this.state.form.user}
                  onChange={this.handleChange}
                  type="text"
                  id="user"
                  name="user"
                  placeholder="Usuario"
                  Icon={UserRound}
                  required
                />
              </div>
              <div className="d-flex flex-column gap-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  value={this.state.form.password}
                  onChange={this.handleChange}
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Contraseña"
                  Icon={KeyRound}
                  required
                />
              </div>
              <div className="position-relative mt-3">
                <Button
                  type="submit"
                  style={{ height: "40px" }}
                  className="w-100"
                  Icon={this.state.loading ? undefined : MoveRight}
                  iconPosition="end"
                  disabled={this.state.loading}
                >
                  {this.state.loading ? (
                    <div className="spinner-border spinner-border-sm" />
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center">
              <hr className="my-2" style={{ borderColor: "#e5e5e5" }} />
              <p
                className="mb-1"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "#a3a3a3",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Equipo
              </p>
              <p
                className="mb-2"
                style={{ fontSize: "12px", color: "#737373" }}
              >
                Verónica De la Rosa Benítez • David Peña Pedraza • Samuel
                Oswaldo Tlahuel Méndez
              </p>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }
}
