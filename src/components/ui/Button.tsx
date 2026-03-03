"use client";

import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  small?: boolean;
};

export function Button({ variant = "primary", small, className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl border border-white/10 " +
    "backdrop-blur-md transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const size = small ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm";
  const variants: Record<string, string> = {
    primary: "bg-white/10 hover:bg-white/15",
    ghost: "bg-transparent hover:bg-white/10",
    danger: "bg-red-500/15 hover:bg-red-500/25 border-red-400/20",
  };

  return <button className={`${base} ${size} ${variants[variant]} ${className}`} {...props} />;
}
