import { articles } from "@/lib/articles";
import { ArticleCard } from "./ArticleCard";

export function BlogHubSection() {
  return (
    <section id="educacion" className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col gap-8 scroll-mt-20">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Educación en Salud Ósea y Articular
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
          Contenido clínico, sin mitos, para que decidas con evidencia.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
