import React, { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  Icon?: LucideIcon;
}

export class Input extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { className, Icon, ...props } = this.props;

    return (
      <div className="position-relative">
        {Icon && (
          <Icon
            size={20}
            color="#737373"
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "0.75rem",
            }}
          />
        )}
        <input
          style={{
            backgroundColor: "#f6f5f2",
            fontSize: "14px",
            paddingLeft: Icon ? "2.5rem" : "0.75rem",
            border: "1px solid #e8e8e8",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
            paddingTop: "10px",
            paddingBottom: "10px",
            borderRadius: "12px",
          }}
          className={cn(className, "form-control")}
          {...props}
        />
      </div>
    );
  }
}
