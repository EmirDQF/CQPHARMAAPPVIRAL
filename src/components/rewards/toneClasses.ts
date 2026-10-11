import type { RewardDefinition } from "@/lib/rewards/schemas";

/** Clases literales (Tailwind no detecta nombres armados en tiempo de ejecución). */
export const TONE_CARD_CLASS: Record<RewardDefinition["tone"], string> = {
  mint: "bg-pastel-mint text-pastel-mint-ink",
  sky: "bg-pastel-sky text-pastel-sky-ink",
  lavender: "bg-pastel-lavender text-pastel-lavender-ink",
  peach: "bg-pastel-peach text-pastel-peach-ink",
  rose: "bg-pastel-rose text-pastel-rose-ink",
  lemon: "bg-pastel-lemon text-pastel-lemon-ink",
};
