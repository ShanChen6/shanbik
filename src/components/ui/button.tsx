"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      type = "button",
      className = "",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={`ui-button ui-button--${variant} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading && <span className="ui-spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
