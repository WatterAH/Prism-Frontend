import React, { LabelHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface Props extends LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
}

export class Label extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { children, className, ...props } = this.props;

    return (
      <label
        style={{ color: "#6b7280", fontSize: "14px" }}
        className={cn(className, "text-start fw-medium")}
        {...props}
      >
        {children}
      </label>
    );
  }
}
