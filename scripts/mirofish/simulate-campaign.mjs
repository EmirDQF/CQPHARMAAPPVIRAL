#!/usr/bin/env node
// Cliente HTTP de MiroFish (https://github.com/666ghj/MiroFish) para simular la
// recepción de una campaña orgánica de Artikare antes de publicarla.
//
// MiroFish es AGPL-3.0: corre como servicio separado y solo se le habla por HTTP.
// No copies su código dentro de este repositorio.
//
// Uso:
//   node scripts/mirofish/simulate-campaign.mjs <brief.md> "<requisito de simulación>" [--rounds 20]
//
// Variables: MIROFISH_URL (por defecto http://localhost:5001).
// El brief NUNCA debe contener datos de pacientes: viaja a un LLM externo y a Zep Cloud.

import { openAsBlob } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { z } from "zod";

const BASE_URL = process.env.MIROFISH_URL ?? "http://localhost:5001";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 60_000; // una sola petición colgada no debe bloquear el proceso
const DEFAULT_ROUNDS = 20; // MiroFish recomienda < 40 rondas: el costo de LLM crece rápido
const OUTPUT_DIR = join("scripts", "mirofish", "out");
const TERMINAL_RUN_STATES = new Set(["completed", "stopped", "failed"]);

// Contratos mínimos de la API de MiroFish: un cambio en su forma falla con un mensaje claro.
const ProjectSchema = z.object({ project_id: z.string().min(1) });
const TaskStartSchema = z.object({ task_id: z.string().min(1) });
const SimulationSchema = z.object({ simulation_id: z.string().min(1) });
const PrepareSchema = z.object({ already_prepared: z.boolean().optional(), task_id: z.string().optional() });
const ReportStartSchema = z.object({ report_id: z.string().min(1), status: z.string(), task_id: z.string().optional() });
const StatusSchema = z.looseObject({
  status: z.string().optional(),
  runner_status: z.string().optional(),
  progress: z.number().optional(),
  message: z.string().optional(),
  error: z.string().nullish(),
});

function parseArgs(argv) {
  const [briefPath, requirement, ...rest] = argv;
  if (!briefPath || !requirement) {
    throw new Error('Uso: simulate-campaign.mjs <brief.md> "<requisito>" [--rounds N]');
  }
  const roundsFlag = rest.indexOf("--rounds");
  const rounds = roundsFlag >= 0 ? Number(rest[roundsFlag + 1]) : DEFAULT_ROUNDS;
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) {
    throw new Error("--rounds debe ser un entero entre 1 y 100");
  }
  return { briefPath, requirement, rounds };
}

async function callApi(path, { method = "GET", json, form, schema = StatusSchema } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: json ? { "Content-Type": "application/json" } : undefined,
    body: json ? JSON.stringify(json) : form,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(`${method} ${path} -> HTTP ${response.status}: ${payload.error ?? "sin detalle"}`);
  }
  const parsed = schema.safeParse(payload.data);
  if (!parsed.success) throw new Error(`${method} ${path}: respuesta con forma inesperada (${parsed.error.issues[0]?.message})`);
  return parsed.data;
}

async function pollUntil(label, fetchState, isDone) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const state = await fetchState();
    if (state.status === "failed" || state.runner_status === "failed") {
      throw new Error(`${label} falló: ${state.error ?? state.message ?? "sin detalle"}`);
    }
    if (isDone(state)) return state;
    console.log(`  ${label}: ${state.status ?? state.runner_status} ${state.progress ?? ""}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`${label}: se agotó el tiempo de espera`);
}

async function buildGraph(briefPath, requirement) {
  const form = new FormData();
  form.append("files", await openAsBlob(briefPath), basename(briefPath));
  form.append("simulation_requirement", requirement);
  form.append("project_name", `artikare-${basename(briefPath)}`);
  const { project_id: projectId } = await callApi("/api/graph/ontology/generate", { method: "POST", form, schema: ProjectSchema });

  const { task_id: taskId } = await callApi("/api/graph/build", {
    method: "POST",
    json: { project_id: projectId },
    schema: TaskStartSchema,
  });
  await pollUntil("grafo", () => callApi(`/api/graph/task/${taskId}`), (t) => t.status === "completed");
  return projectId;
}

async function runSimulation(projectId, rounds) {
  const { simulation_id: simulationId } = await callApi("/api/simulation/create", {
    method: "POST",
    json: { project_id: projectId },
    schema: SimulationSchema,
  });
  const prepared = await callApi("/api/simulation/prepare", {
    method: "POST",
    json: { simulation_id: simulationId },
    schema: PrepareSchema,
  });
  if (!prepared.already_prepared) {
    await pollUntil(
      "preparación",
      () => callApi("/api/simulation/prepare/status", {
        method: "POST",
        json: { task_id: prepared.task_id, simulation_id: simulationId },
      }),
      (s) => s.status === "ready" || s.status === "completed",
    );
  }
  await callApi("/api/simulation/start", {
    method: "POST",
    json: { simulation_id: simulationId, platform: "parallel", max_rounds: rounds },
  });
  await pollUntil(
    "simulación",
    () => callApi(`/api/simulation/${simulationId}/run-status`),
    (s) => TERMINAL_RUN_STATES.has(s.runner_status),
  );
  return simulationId;
}

async function generateReport(simulationId) {
  const started = await callApi("/api/report/generate", {
    method: "POST",
    json: { simulation_id: simulationId },
    schema: ReportStartSchema,
  });
  if (started.status !== "completed") {
    await pollUntil(
      "reporte",
      () => callApi("/api/report/generate/status", {
        method: "POST",
        json: { task_id: started.task_id, simulation_id: simulationId },
      }),
      (r) => r.status === "completed",
    );
  }
  const response = await fetch(`${BASE_URL}/api/report/${started.report_id}/download`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Descarga del reporte -> HTTP ${response.status}`);
  return { reportId: started.report_id, markdown: await response.text() };
}

async function main() {
  const { briefPath, requirement, rounds } = parseArgs(process.argv.slice(2));
  await callApi("/health", { schema: z.unknown() }).catch(() => {
    throw new Error(`MiroFish no responde en ${BASE_URL}. Levántalo primero (ver .agents/skills/mirofish/SKILL.md).`);
  });

  console.log("1/3 Construyendo grafo de conocimiento…");
  const projectId = await buildGraph(briefPath, requirement);
  console.log(`2/3 Simulando ${rounds} rondas…`);
  const simulationId = await runSimulation(projectId, rounds);
  console.log("3/3 Generando reporte…");
  const { reportId, markdown } = await generateReport(simulationId);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `${reportId}.md`);
  await writeFile(outputPath, markdown);
  console.log(`Reporte guardado en ${outputPath}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
