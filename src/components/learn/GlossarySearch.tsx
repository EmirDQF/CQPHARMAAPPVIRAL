"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { searchGlossary } from "@/lib/learn/glossary";

/** Glosario con buscador (sin tildes ni mayúsculas). */
export function GlossarySearch() {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const results = searchGlossary(query);

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-3">
      <h2 id={`${inputId}-title`} className="text-2xl font-black text-clinic">
        Glosario
      </h2>
      <label htmlFor={inputId} className="text-lg font-bold">
        Busca una palabra
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Por ejemplo: densitometría"
          className="min-h-14 w-full rounded-control border-2 border-line bg-surface pl-12 pr-4 text-lg"
        />
      </div>
      <p role="status" className="text-base text-muted">
        {results.length === 1 ? "1 resultado" : `${results.length} resultados`}
      </p>
      {results.length === 0 ? (
        <p className="rounded-control bg-pastel-lemon px-4 py-3 text-lg text-pastel-lemon-ink">
          No encontramos esa palabra. Prueba con otra o pregúntale a tu médico. <span aria-hidden="true">🙂</span>
        </p>
      ) : (
        <dl className="flex flex-col gap-2">
          {results.map((item) => (
            <div key={item.term} className="rounded-control border border-line bg-surface px-4 py-3 shadow-soft">
              <dt className="text-lg font-black text-clinic">{item.term}</dt>
              <dd className="text-lg">{item.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
