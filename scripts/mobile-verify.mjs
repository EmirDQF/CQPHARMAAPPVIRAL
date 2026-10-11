// npm run mobile:verify — candado previo al release, se detiene en el primer fallo:
// tsc → eslint → vitest → verify-env --strict → capacitorEnv (release) → verify-android-release.
import { join } from "node:path";
import { NODE_TS_FLAGS, fail, run, step } from "./lib/mobile.mjs";

const node = (script, ...args) => ["node", [...NODE_TS_FLAGS, join("scripts", script), ...args]];

const STEPS = [
  ["TypeScript (tsc --noEmit)", ["npx", ["tsc", "--noEmit"]]],
  ["ESLint", ["npx", ["eslint"]]],
  ["Vitest", ["npx", ["vitest", "run"]]],
  ["verify-env --strict (solo nombres)", node("verify-env.ts", "--strict")],
  ["capacitorEnv en modo release", node("check-capacitor-release.ts")],
  ["verify-android-release", node("verify-android-release.ts")],
];

try {
  STEPS.forEach(([title, [command, args]]) => {
    step(title);
    run(command, args);
  });
  process.stdout.write("\nmobile:verify: OK\n");
} catch (error) {
  fail(error);
}
