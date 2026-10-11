import type { RewardDefinition } from "@/lib/rewards/schemas";

const SIZE = 64;
const CENTER = SIZE / 2;

/** Formas simples en la tinta de cada pastel (AA 3:1 sobre su fondo). */
const SHAPES: Record<RewardDefinition["illustration"], string> = {
  sprout: "M32 46V30M32 32c-8 0-12-6-12-12 8 0 12 5 12 12zm0-2c0-8 5-13 13-13 0 8-5 13-13 13z",
  sun: "M32 22a10 10 0 1 1 0 20a10 10 0 1 1 0-20M32 12v5M32 47v5M12 32h5M47 32h5M18 18l4 4M42 42l4 4M46 18l-4 4M22 42l-4 4",
  moon: "M38 16a16 16 0 1 0 10 26a13 13 0 0 1-10-26z",
  star: "M32 14l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z",
  heart: "M32 46s-14-8-14-18a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 10-14 18-14 18z",
  mountain: "M12 46l13-20 7 10 6-8 14 18zM38 20a3 3 0 1 1 0 .1",
  calendar: "M18 20h28v26H18zM18 28h28M25 16v8M39 16v8M25 36h4M35 36h4",
  hands: "M20 40c4-8 8-10 12-10s8 2 12 10M24 28a4 4 0 1 1 0 .1M40 28a4 4 0 1 1 0 .1",
};

interface RewardIllustrationProps {
  reward: Pick<RewardDefinition, "illustration" | "tone">;
  isLocked?: boolean;
}

export function RewardIllustration({ reward, isLocked = false }: RewardIllustrationProps) {
  const background = isLocked ? "var(--color-surface)" : `var(--color-pastel-${reward.tone})`;
  const ink = isLocked ? "var(--color-muted)" : `var(--color-pastel-${reward.tone}-ink)`;
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="shrink-0">
      <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill={background} stroke={ink} strokeWidth={2} strokeDasharray={isLocked ? "4 4" : undefined} />
      <path d={SHAPES[reward.illustration]} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
