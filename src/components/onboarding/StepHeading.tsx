"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Título de cada paso: recibe el foco al aparecer para que el lector de pantalla anuncie el cambio. */
export function StepHeading({ children }: { children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <h1 ref={headingRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight text-clinic outline-none">
      {children}
    </h1>
  );
}
