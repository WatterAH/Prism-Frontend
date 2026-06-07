import { Diamond } from "lucide-react";
import React from "react";

export class Logo extends React.Component {
  render() {
    return (
      <div
        className="d-flex align-items-center justify-content-center rounded-4"
        style={{
          backgroundColor: "#202020",
          width: "50px",
          height: "50px",
        }}
      >
        <Diamond color="#fff" size={25} fill="#fff" />
      </div>
    );
  }
}
