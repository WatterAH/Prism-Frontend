import React, { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  Icon?: LucideIcon;
  iconPosition?: "start" | "end";
}

export class Button extends React.Component<Props> {
  render() {
    const {
      children,
      className,
      Icon,
      iconPosition = "start",
      ...props
    } = this.props;

    return (
      <button
        className={cn(
          className,
          "btn btn-primary d-flex align-items-center justify-content-center gap-2",
        )}
        style={{
          padding: "10px 20px",
          borderRadius: "12px",
        }}
        {...props}
      >
        {Icon && iconPosition === "start" && <Icon size={18} color="#ffffff" />}
        {children}
        {Icon && iconPosition === "end" && <Icon size={18} color="#ffffff" />}
      </button>
    );
  }
}
