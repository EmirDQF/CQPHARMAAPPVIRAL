import Link from "next/link";
import type { Article } from "@/lib/articles";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 h-full hover:border-brand transition-colors"
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-brand-light text-brand-dark px-3 py-1">
          {article.tag}
        </span>
        <span className="text-neutral-400">Lectura {article.readTimeMinutes} min</span>
      </div>

      <h3 className="text-lg font-bold text-balance">{article.title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        {article.excerpt}
      </p>

      <span className="text-sm font-semibold text-brand mt-auto">
        Leer artículo completo →
      </span>
    </Link>
  );
}
