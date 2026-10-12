import type { ArmPose, ArtikoAccessory, ArtikoEffect, EyeStyle, MouthStyle } from "@/lib/mascot/mascot";

/**
 * Piezas SVG de Artiko (viewBox 0 0 120 140). Solo tokens de color de
 * globals.css: el dibujo cambia de paleta sin tocar este archivo. Las
 * micro-animaciones son clases `artiko-*` (globals.css), siempre `motion-safe`.
 */
export const INK = "var(--color-clinic-deep)";
const LIGHT = "white";
const STROKE = { stroke: INK, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const EYE_CENTERS = [49, 71] as const;
const EYE_Y = 36;

function OpenEye({ cx, big, lookUp }: { cx: number; big: boolean; lookUp: boolean }) {
  const [dx, dy] = lookUp ? [2, -3] : [0, 0];
  return (
    <g>
      <ellipse cx={cx} cy={EYE_Y} rx={big ? 10 : 9} ry={big ? 12 : 10.5} fill={LIGHT} {...STROKE} strokeWidth={1.5} />
      <circle cx={cx + dx} cy={EYE_Y + 1 + dy} r={big ? 6.5 : 5.5} fill={INK} />
      <circle cx={cx + dx - 2} cy={EYE_Y - 2 + dy} r={big ? 2.6 : 2} fill={LIGHT} />
      <circle cx={cx + dx + 2} cy={EYE_Y + 3 + dy} r={big ? 1.4 : 1} fill={LIGHT} />
    </g>
  );
}

export function Eyes({ style }: { style: EyeStyle }) {
  if (style === "closed") {
    return (
      <g fill="none" strokeWidth={2.5} {...STROKE}>
        {EYE_CENTERS.map((cx) => (
          <path key={cx} d={`M${cx - 7},${EYE_Y} q7,5 14,0`} />
        ))}
      </g>
    );
  }
  return (
    <g className="artiko-blink">
      {EYE_CENTERS.map((cx) => (
        <OpenEye key={cx} cx={cx} big={style === "sparkle"} lookUp={style === "lookUp"} />
      ))}
    </g>
  );
}

export function Mouth({ style }: { style: MouthStyle }) {
  switch (style) {
    case "grin":
      return (
        <g>
          <path d="M51,47 q9,10 18,0 z" fill={INK} {...STROKE} strokeWidth={1.5} />
          <path d="M55,51.5 q5,3 10,0 q-5,-3 -10,0 z" fill="var(--color-pink)" />
        </g>
      );
    case "open":
      return <ellipse cx={60} cy={50} rx={5} ry={4} fill={INK} />;
    case "curious":
      return <circle cx={60} cy={50} r={2.8} fill={INK} />;
    case "rest":
      return <path d="M56,50 q4,2 8,0" fill="none" strokeWidth={2.5} {...STROKE} />;
    case "smile":
      return <path d="M53,47 q7,7 14,0" fill="none" strokeWidth={2.5} {...STROKE} />;
  }
}

function Arm({ d, hand, className }: { d: string; hand: [number, number]; className?: string }) {
  return (
    <g className={className}>
      <path d={d} fill="none" strokeWidth={5} {...STROKE} />
      <circle cx={hand[0]} cy={hand[1]} r={4.5} fill={LIGHT} {...STROKE} strokeWidth={2} />
    </g>
  );
}

const LEFT_REST = <Arm d="M31,72 L20,88" hand={[19, 90]} />;
const RIGHT_REST = <Arm d="M89,72 L100,88" hand={[101, 90]} />;

function FlexArms() {
  return (
    <g>
      <Arm d="M31,72 L17,72 L17,57" hand={[17, 54]} />
      <circle cx={23} cy={68.5} r={4} fill={LIGHT} {...STROKE} strokeWidth={1.5} />
      <Arm d="M89,72 L103,72 L103,57" hand={[103, 54]} />
      <circle cx={97} cy={68.5} r={4} fill={LIGHT} {...STROKE} strokeWidth={1.5} />
    </g>
  );
}

function Megaphone() {
  return (
    <g>
      <Arm d="M89,72 L99,68" hand={[100, 67]} />
      <path d="M99,63 L114,55 L114,77 L99,70 z" fill="var(--color-sky)" {...STROKE} strokeWidth={2} />
      <rect x={95} y={62} width={6} height={9} rx={2} fill="var(--color-gold)" {...STROKE} strokeWidth={1.5} />
    </g>
  );
}

export function Arms({ pose }: { pose: ArmPose }) {
  switch (pose) {
    case "wave":
      return <g>{LEFT_REST}<Arm className="artiko-wave" d="M89,70 L104,52" hand={[105, 50]} /></g>;
    case "up":
      return (
        <g>
          <Arm d="M31,70 L16,50" hand={[15, 48]} />
          <Arm d="M89,70 L104,50" hand={[105, 48]} />
        </g>
      );
    case "flex":
      return <FlexArms />;
    case "chin":
      return <g>{LEFT_REST}<Arm d="M89,74 Q84,62 72,57" hand={[70, 56]} /></g>;
    case "megaphone":
      return <g>{LEFT_REST}<Megaphone /></g>;
    case "rest":
      return <g>{LEFT_REST}{RIGHT_REST}</g>;
  }
}

function Sneaker({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={119} width={21} height={9} rx={4.5} fill="var(--color-pink)" {...STROKE} strokeWidth={1.5} />
      <path d={`M${x + 5},${123} l5,-2 l5,2`} fill="none" stroke={LIGHT} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={x - 1} y={127} width={23} height={4} rx={2} fill={LIGHT} {...STROKE} strokeWidth={1.5} />
    </g>
  );
}

export function LegsAndSneakers() {
  return (
    <g>
      <path d="M49,108 L49,121 M71,108 L71,121" fill="none" strokeWidth={5} {...STROKE} />
      <Sneaker x={37} />
      <Sneaker x={62} />
    </g>
  );
}

/** Cuerpo de cápsula: mitad superior verde vital, inferior blanca, cinturón articular brillante. */
export function CapsuleBody() {
  return (
    <g>
      <path d="M30,60 V40 A30,30 0 0 1 90,40 V60 Z" fill="var(--color-vital)" />
      <path d="M30,60 V80 A30,30 0 0 0 90,80 V60 Z" fill={LIGHT} />
      <rect x={30} y={10} width={60} height={100} rx={30} fill="none" stroke={INK} strokeWidth={3} />
      <ellipse cx={41} cy={28} rx={3.5} ry={8} fill={LIGHT} opacity={0.55} />
      <circle cx={40} cy={47} r={4} fill="var(--color-pink)" opacity={0.6} />
      <circle cx={80} cy={47} r={4} fill="var(--color-pink)" opacity={0.6} />
      <rect x={27} y={56} width={66} height={9} rx={4.5} fill="var(--color-gold)" stroke="var(--color-gold-deep)" strokeWidth={1.5} />
      <circle className="artiko-glow" cx={60} cy={60.5} r={10} fill="var(--color-lime)" opacity={0.35} />
      <circle cx={60} cy={60.5} r={6} fill="var(--color-lime)" stroke="var(--color-vital-deep)" strokeWidth={1.5} />
      <circle cx={58} cy={58.5} r={1.6} fill={LIGHT} />
    </g>
  );
}

/** Efectos que van detrás del cuerpo. */
export function BackEffects({ effects }: { effects: readonly ArtikoEffect[] }) {
  if (!effects.includes("flames")) return null;
  return (
    <g className="artiko-flicker">
      <path d="M22,112 C10,96 22,86 20,72 C30,82 34,96 30,112 z" fill="var(--color-streak)" />
      <path d="M98,112 C110,96 98,86 100,72 C90,82 86,96 90,112 z" fill="var(--color-streak)" />
      <path d="M24,112 C18,102 24,96 24,88 C29,96 31,104 28,112 z" fill="var(--color-gold)" />
      <path d="M96,112 C102,102 96,96 96,88 C91,96 89,104 92,112 z" fill="var(--color-gold)" />
    </g>
  );
}

const CONFETTI: readonly [number, number, string][] = [
  [10, 20, "var(--color-sky)"],
  [108, 18, "var(--color-pink)"],
  [18, 6, "var(--color-gold)"],
  [100, 4, "var(--color-xp)"],
  [6, 44, "var(--color-lime)"],
  [114, 40, "var(--color-streak)"],
];

function Sparkle({ x, y }: { x: number; y: number }) {
  return <path d={`M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y} L${x + 1.5},${y + 1.5} L${x},${y + 5} L${x - 1.5},${y + 1.5} L${x - 5},${y} L${x - 1.5},${y - 1.5} z`} fill="var(--color-gold)" />;
}

/** Efectos que van delante del cuerpo. */
export function FrontEffects({ effects }: { effects: readonly ArtikoEffect[] }) {
  return (
    <g>
      {effects.includes("headband") && (
        <g>
          <rect x={31} y={19} width={58} height={7} rx={3} fill="var(--color-streak-hot)" />
          <path d="M88,22 L104,15 L101,23 L106,29 z" fill="var(--color-streak-hot)" />
        </g>
      )}
      {effects.includes("confetti") && (
        <g className="artiko-confetti">
          {CONFETTI.map(([x, y, fill]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1} fill={fill} transform={`rotate(25 ${x} ${y})`} />
          ))}
        </g>
      )}
      {effects.includes("sparkles") && (
        <g className="artiko-glow">
          <Sparkle x={14} y={22} />
          <Sparkle x={108} y={30} />
        </g>
      )}
      {effects.includes("zzz") && (
        <g className="artiko-zzz" fill="var(--color-sky-deep)" fontWeight={900} fontFamily="var(--font-nunito), sans-serif">
          <text x={94} y={22} fontSize={10}>z</text>
          <text x={102} y={11} fontSize={14}>Z</text>
        </g>
      )}
      {effects.includes("thought") && (
        <g fill={LIGHT} stroke={INK} strokeWidth={1.5}>
          <circle cx={93} cy={20} r={2} />
          <circle cx={100} cy={12} r={3} />
          <circle cx={109} cy={5} r={4} />
        </g>
      )}
      {effects.includes("soundWaves") && (
        <g fill="none" stroke="var(--color-sky-deep)" strokeWidth={2} strokeLinecap="round" className="artiko-glow">
          <path d="M117,60 q3,6 0,12" />
          <path d="M119,55 q6,11 0,22" />
        </g>
      )}
    </g>
  );
}

export function Accessories({ items }: { items: readonly ArtikoAccessory[] }) {
  return (
    <g>
      {items.includes("scarf") && (
        <g data-accessory="scarf">
          <rect x={30} y={65} width={60} height={8} rx={4} fill="var(--color-xp)" />
          <path d="M40,70 L36,90 L44,90 L47,71 z" fill="var(--color-xp-deep)" />
        </g>
      )}
      {items.includes("glasses") && (
        <g data-accessory="glasses" fill="none" stroke={INK} strokeWidth={2}>
          <circle cx={49} cy={36} r={12} />
          <circle cx={71} cy={36} r={12} />
          <path d="M58,33 q2,-2 4,0" />
        </g>
      )}
      {items.includes("cap") && (
        <g data-accessory="cap">
          <path d="M33,24 Q60,-4 87,24 z" fill="var(--color-sky)" {...STROKE} strokeWidth={2} />
          <path d="M80,22 L104,22 Q104,27 98,27 L80,27 z" fill="var(--color-sky-deep)" />
          <circle cx={60} cy={8} r={2.5} fill="var(--color-sky-deep)" />
        </g>
      )}
    </g>
  );
}
