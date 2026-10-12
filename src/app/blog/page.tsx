import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/landing/ArticleCard";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Blog: mito vs. evidencia",
  description: "Artículos cortos y educativos sobre huesos y articulaciones. No reemplazan la consulta con tu médico.",
};

/** Índice del blog: los mismos artículos que la landing, en una sola página (destino de los enlaces /blog). */
export default function BlogIndexPage() {
  const sorted = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <Link href="/" className="min-h-12 flex items-center text-base font-bold text-clinic">
        ← Volver a Artikare
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-clinic">Mito vs. evidencia</h1>
        <p className="text-lg text-muted">Lecturas de 2 minutos. Son educativas y no reemplazan la consulta con tu médico.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sorted.map((article) => (
          <li key={article.slug}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </main>
  );
}
