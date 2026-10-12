"use client";

import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { triggerHaptic, type HapticStrength } from "@/lib/feedback/haptics";
import { gameButtonClasses } from "./gameButtonClasses";

export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof gameButtonClasses> & {
    /** Intensidad de la vibración al tocar; `false` la omite (p. ej. botones secundarios). */
    haptic?: HapticStrength | false;
  };

/** Botón pastel con vibración opcional al tocar; para un <Link> con el mismo aspecto, usa `gameButtonClasses`. */
export function GameButton({
  className,
  tone,
  size,
  block,
  haptic = "light",
  type = "button",
  onClick,
  ...props
}: GameButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (props["aria-disabled"] === true || props["aria-disabled"] === "true") {
      event.preventDefault();
      return;
    }
    if (haptic) void triggerHaptic(haptic);
    onClick?.(event);
  }

  return (
    <button
      type={type}
      className={cn(gameButtonClasses({ tone, size, block }), className)}
      onClick={handleClick}
      {...props}
    />
  );
}
