import React from "react";

interface ContadorState {
  clicks: number;
}

export class BotonContador extends React.Component<{}, ContadorState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      clicks: 0,
    };
  }

  incrementarCuenta = () => {
    this.setState((prevState) => ({
      clicks: prevState.clicks + 1,
    }));
  };

  render() {
    return (
      <div className="container mt-5 text-center">
        <div
          className="card shadow-sm p-4"
          style={{ maxWidth: "300px", margin: "auto" }}
        >
          <h2 className="card-title">Contador POO</h2>

          <p className="display-4 text-primary my-3">{this.state.clicks}</p>

          <button
            className="btn btn-primary btn-lg"
            onClick={this.incrementarCuenta}
          >
            Aumentar cuenta
          </button>
        </div>
      </div>
    );
  }
}
