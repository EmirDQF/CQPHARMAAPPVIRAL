---
name: mirofish
description: Simular la recepción de campañas orgánicas de Artikare (Reels, copys de WhatsApp, "Mito vs. Evidencia", "Protege a quien te cuidó") con el motor multiagente MiroFish antes de publicarlas. Úsala cuando se pida pre-testear un copy, gancho o campaña, o predecir objeciones del público.
---

# MiroFish — pre-test de campañas por simulación multiagente

MiroFish (github.com/666ghj/MiroFish) construye un grafo de conocimiento a
partir de un documento semilla, genera miles de agentes con personalidad y
memoria (Zep) y los hace interactuar en dos plataformas simuladas (tipo
Twitter y Reddit, motor OASIS). Al final un ReportAgent redacta un informe.

**No es un servidor MCP.** Se integra como servicio HTTP aparte.

## Restricciones (leer antes de usar)

- **Licencia AGPL-3.0**: nunca copiar código de MiroFish en este repo ni
  enlazarlo dentro de la app. Solo llamadas HTTP a un servicio separado.
- **Privacidad (MASVS / datos de salud)**: el brief viaja a un LLM externo y
  a Zep Cloud. Solo material de marketing; **cero datos de pacientes**,
  densitometrías, nombres o teléfonos.
- **Costo**: cada ronda consume muchos tokens. Empezar con ≤ 20 rondas.
- **Resultado orientativo**: una simulación no es evidencia. No citar sus
  números como datos reales de audiencia.
- **Copy clínico**: el brief y cualquier copy derivado respetan las frases
  prohibidas y verbos permitidos de `CLAUDE.md`.

## Puesta en marcha (fuera de este repo)

Requisitos: Node 18+, Python 3.11–3.12, `uv`, una API LLM compatible con
OpenAI y una clave de Zep Cloud.

```bash
git clone https://github.com/666ghj/MiroFish ../MiroFish
cd ../MiroFish
cp .env.example .env   # LLM_API_KEY, LLM_BASE_URL, LLM_MODEL_NAME, ZEP_API_KEY
npm run setup:all
npm run dev            # UI :3000, API :5001
# alternativa: docker compose up -d
```

## Uso desde este proyecto

1. Escribir el brief en Markdown (público objetivo, gancho, copy, CTA), p. ej.
   `scripts/mirofish/briefs/silla-y-crujido.md`.
2. Ejecutar:
   ```bash
   node scripts/mirofish/simulate-campaign.mjs scripts/mirofish/briefs/silla-y-crujido.md \
     "Predice cómo reaccionan adultos peruanos de 40-65 años y sus hijos de 25-45 a este Reel: objeciones, compartidos y dudas médicas" \
     --rounds 20
   ```
   `MIROFISH_URL` cambia el host (por defecto `http://localhost:5001`).
3. El informe queda en `scripts/mirofish/out/<report_id>.md` (ignorado por git).

## Flujo de la API (lo que hace el script)

| Paso | Endpoint |
|---|---|
| Ontología desde el brief | `POST /api/graph/ontology/generate` (multipart: `files`, `simulation_requirement`) → `project_id` |
| Grafo | `POST /api/graph/build` → `task_id`; sondear `GET /api/graph/task/<id>` |
| Simulación | `POST /api/simulation/create` → `prepare` (sondear `prepare/status`) → `start` (`max_rounds`) → sondear `GET /api/simulation/<id>/run-status` |
| Informe | `POST /api/report/generate` (sondear `generate/status`) → `GET /api/report/<id>/download` |
| Profundizar | `POST /api/simulation/interview` / `POST /api/report/chat` para preguntar a agentes concretos |

## Patrones de MiroFish reutilizables (solo como idea, sin copiar código)

- **Semilla → grafo → agentes**: extraer entidades/relaciones antes de generar
  perfiles da agentes coherentes con el contexto.
- **Tareas largas asíncronas**: `POST` devuelve `task_id`; el cliente sondea
  estado/progreso. Útil para cualquier proceso lento en Artikare.
- **Entrevista post-simulación**: preguntar a un agente "¿por qué no
  compartiste?" da objeciones accionables para reescribir el copy.

## Cómo leer el informe

Buscar: objeciones recurrentes, frases que generan desconfianza médica,
qué segmento comparte (hijos vs. padres) y si alguna interpretación roza una
promesa de cura; si es así, reescribir el copy antes de publicar.
