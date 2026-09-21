import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/lib/articles";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
      <Link href="/#educacion" className="text-sm text-brand font-semibold">
        ← Volver a Artikare
      </Link>

      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-brand-light text-brand-dark px-3 py-1">
          {article.tag}
        </span>
        <span className="text-neutral-400">Lectura {article.readTimeMinutes} min</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-balance">{article.title}</h1>

      <div className="flex flex-col gap-4 text-neutral-700 dark:text-neutral-300">
        {article.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="rounded-xl bg-neutral-100 dark:bg-neutral-900 px-4 py-3 text-xs text-neutral-500">
        Este contenido es informativo y no reemplaza un diagnóstico médico
        profesional.
      </div>
    </main>
  );
}
