export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  readTimeMinutes: number;
  publishedAt: string;
  content: string[];
}

export const articles: Article[] = [
  {
    slug: "mito-gelatina-pata-vs-colageno-hidrolizado",
    title: "El mito de la gelatina de pata: por qué no regenera tus rodillas",
    excerpt:
      "La molécula de colágeno de la gelatina tradicional es demasiado grande para absorberse en el intestino. Te explicamos la diferencia con el colágeno hidrolizado bioasimilable.",
    tag: "Mito vs. Evidencia",
    readTimeMinutes: 2,
    publishedAt: "2026-08-04",
    content: [
      "Es un remedio casero muy popular: hervir patas de pollo o de res para \"regenerar\" el cartílago de las rodillas. El problema es que la ciencia detrás de la absorción de proteínas no funciona así.",
      "El colágeno de la gelatina tradicional es una molécula muy grande. Al llegar al estómago, se degrada junto con el resto de las proteínas de la dieta y se fragmenta en aminoácidos genéricos, sin ninguna garantía de que esos aminoácidos vuelvan a ensamblarse específicamente en tu cartílago articular.",
      "El colágeno hidrolizado, en cambio, se procesa industrialmente mediante hidrólisis enzimática: se rompe previamente en péptidos pequeños (di- y tripéptidos) que sí pueden absorberse de forma más eficiente en el intestino y llegar al torrente sanguíneo con mayor biodisponibilidad.",
      "Además, la síntesis de colágeno en el cuerpo depende de un cofactor clave: la Vitamina C. Sin ella, las enzimas que estabilizan la estructura del colágeno (prolil y lisil hidroxilasa) no funcionan correctamente. Por eso un protocolo serio combina colágeno hidrolizado con Vitamina C pura, no solo un caldo casero.",
      "Este artículo es educativo y no reemplaza una valoración médica. Si tienes dolor articular persistente, consulta con un especialista en reumatología.",
    ],
  },
  {
    slug: "peligro-de-tomar-calcio-solo",
    title: "Tomar calcio por tu cuenta: lo que debes saber",
    excerpt:
      "El calcio en suplementos, tomado sin indicación médica, se ha asociado a cálculos renales y su efecto cardiovascular sigue en debate. Esto es lo que debes saber.",
    tag: "Mito vs. Evidencia",
    readTimeMinutes: 2,
    publishedAt: "2026-08-11",
    content: [
      "Cuando se detecta baja densidad ósea, el primer reflejo suele ser \"voy a tomar calcio\". Pero el calcio, tomado de forma aislada, no necesariamente termina donde debería: en el hueso.",
      "El calcio necesita transporte y dirección. La Vitamina D3 es la que permite que el intestino absorba el calcio de forma eficiente, y el Magnesio (idealmente en forma de Citrato, de mejor biodisponibilidad) participa en el metabolismo óseo y contribuye al mantenimiento normal de los huesos.",
      "Algunos estudios han asociado la suplementación de calcio aislado con cálculos renales, y su posible efecto cardiovascular sigue en debate en la literatura médica. Ningún suplemento elimina ese riesgo: la dosis adecuada de calcio la define tu médico.",
      "Por eso, cuando tu médico lo indica, un protocolo de nutrición ósea puede combinar Citrato de Magnesio, Vitamina D3 y Zinc como complemento de tu tratamiento, en lugar de tomar calcio por tu cuenta.",
      "Este contenido es informativo. La indicación de cualquier suplemento debe estar respaldada por evaluación médica y, cuando sea posible, por una densitometría ósea.",
    ],
  },
  {
    slug: "prueba-de-la-silla-evalua-tus-articulaciones",
    title: "La prueba de la silla: evalúa tus articulaciones en casa",
    excerpt:
      "Un test funcional de 30 segundos que puedes hacer ahora mismo para tener una primera señal sobre la fuerza y estabilidad de tus rodillas y caderas.",
    tag: "Reto Funcional",
    readTimeMinutes: 2,
    publishedAt: "2026-08-18",
    content: [
      "Esta es una versión simplificada de una prueba funcional usada en evaluación geriátrica y reumatológica para medir fuerza de miembros inferiores: la prueba de sentarse y levantarse de una silla.",
      "Cómo hacerla: siéntate en una silla firme, sin apoyabrazos, con los pies apoyados en el piso. Cruza los brazos sobre el pecho. Levántate y vuelve a sentarte 5 veces seguidas, lo más rápido que puedas hacerlo con control.",
      "Qué observar: si sientes dolor agudo, inestabilidad, mareo, o si necesitas apoyarte con las manos para completar el movimiento, son señales de que tus articulaciones y tu musculatura de soporte podrían estar perdiendo fuerza o estabilidad.",
      "Esta prueba no diagnostica osteoporosis ni osteopenia por sí sola: solo la densitometría ósea puede hacerlo. Pero es una alerta funcional temprana que, combinada con el Test de Edad Articular de Artikare, te da una foto más completa de tu situación.",
      "Si tuviste dificultad al hacer la prueba, te recomendamos completar el test online y conversar con un especialista sobre una densitometría ósea preventiva.",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
