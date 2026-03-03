"use client";

import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm " +
        "outline-none focus:border-white/25 " +
        className
      }
      {...props}
    />
  );
}
