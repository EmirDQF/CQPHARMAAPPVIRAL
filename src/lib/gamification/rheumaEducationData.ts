import type { ContentSource } from "../learn/schemas";
import {
  rheumaEducationSchema,
  type HomeSpot,
  type MemoryPair,
  type MythItem,
  type PlateItem,
  type QuizItem,
  type RheumaEducation,
  type ShieldItem,
} from "./rheumaEducationSchemas";

/**
 * Contenido de los mini-juegos educativos (información general, no
 * diagnóstico). Solo hechos de consenso amplio; sin dosis, dietas milagro ni
 * beneficios de suplementos. Todo `pendiente` de validación del médico del
 * proyecto (docs/BLOCKERS.md). Se valida con Zod al cargar el módulo.
 */
const PENDING = "pendiente" as const;

const myth = (id: string, statement: string, isFact: boolean, explanation: string, source: ContentSource): MythItem => ({
  id,
  statement,
  isFact,
  explanation,
  source,
  reviewStatus: PENDING,
});

const MYTHS: readonly MythItem[] = [
  myth("osteoporosis-duele", "La osteoporosis duele mientras avanza.", false, "Es silenciosa: no duele por sí sola. Muchas veces se descubre con una fractura o con una densitometría.", "IOF"),
  myth("fractura-leve", "Romperse un hueso con una caída leve puede ser señal de huesos frágiles.", true, "Un hueso sano suele resistir una caída desde tu propia altura. Si se rompe, conviene evaluar tus huesos.", "IOF"),
  myth("solo-mujeres", "Solo las mujeres tienen osteoporosis.", false, "Es más frecuente en mujeres, pero los hombres también pueden tenerla, sobre todo con la edad.", "IOF"),
  myth("dmo-duele", "La densitometría ósea duele.", false, "Es un examen rápido e indoloro: te echas en una camilla unos minutos.", "IOF"),
  myth("rodillas-suenan", "Si te suenan las rodillas, siempre es artrosis.", false, "Muchos crujidos sin dolor ni hinchazón son inofensivos. Si vienen con dolor o hinchazón, consulta.", "ACR"),
  myth("rigidez-larga", "Una rigidez de la mañana que dura más de media hora merece consulta.", true, "La rigidez prolongada al despertar puede indicar inflamación. Tu médico puede evaluarla.", "EULAR"),
  myth("calcio-por-tu-cuenta", "Tomar suplementos de calcio por tu cuenta siempre es seguro.", false, "Si necesitas suplementos y en qué cantidad lo define tu médico, según tu alimentación y tu salud.", "IOF"),
  myth("sol-vitamina-d", "El sol ayuda a la piel a producir vitamina D.", true, "La piel produce vitamina D con la luz solar. Un poco de sol, sin quemarse, es suficiente.", "IOF"),
  myth("cama-lumbalgia", "Con dolor de espalda baja, lo mejor es pasar varios días en cama.", false, "El reposo prolongado no suele ser lo indicado. Tu médico te dirá qué actividades puedes seguir haciendo.", "OMS"),
  myth("caidas-fracturas", "Las caídas son una causa importante de fracturas en personas mayores.", true, "Por eso prevenir caídas en casa también es cuidar tus huesos.", "OMS"),
  myth("artrosis-solo-mayores", "La artrosis solo les da a las personas mayores.", false, "Es más frecuente con la edad, pero también puede aparecer antes, por ejemplo después de una lesión.", "ACR"),
  myth("fumar-huesos", "Fumar afecta la salud de los huesos.", true, "El tabaco se asocia a huesos más frágiles y a más fracturas.", "IOF"),
  myth("un-alimento", "Un solo alimento basta para cuidar tus articulaciones.", false, "Ningún alimento aislado hace milagros. Lo que suma es una alimentación variada y hábitos de cada día.", "ACR"),
  myth("gota-de-golpe", "La gota suele empezar de golpe, con una articulación roja y muy dolorosa.", true, "El ataque típico aparece de pronto, a menudo en el dedo gordo del pie. Merece consulta.", "ACR"),
  myth("fibromialgia-dana", "La fibromialgia daña las articulaciones.", false, "El dolor es real, pero la fibromialgia no daña las articulaciones ni los músculos.", "EULAR"),
  myth("natural-sin-contar", "Si un suplemento es natural, no hace falta contárselo al médico.", false, "Cuéntale siempre a tu médico todo lo que tomas, incluso lo natural: puede interactuar con tus medicamentos.", "SER"),
  myth("menopausia-hueso", "Después de la menopausia, la pérdida de hueso puede acelerarse.", true, "Al bajar los estrógenos, el hueso se pierde más rápido. Es buen momento para conversarlo con tu médico.", "IOF"),
  myth("ejercicio-prohibido", "Si tienes artrosis, el ejercicio está prohibido.", false, "Tu médico te dirá qué actividad te conviene y cuánta, según tu caso.", "ACR"),
];

const shield = (id: string, emoji: string, label: string, group: ShieldItem["group"], explanation: string, source: ContentSource): ShieldItem => ({
  id,
  emoji,
  label,
  group,
  explanation,
  source,
  reviewStatus: PENDING,
});

const SHIELD: readonly ShieldItem[] = [
  shield("caminar", "🚶", "Caminar a tu ritmo", "cuida", "La actividad física regular ayuda a mantener músculo y hueso. Hazla con el visto bueno de tu médico.", "OMS"),
  shield("lacteos", "🥛", "Incluir lácteos o sardinas en tu semana", "cuida", "Son buenas fuentes de calcio dentro de una alimentación variada.", "IOF"),
  shield("sol-moderado", "🌤️", "Un rato de sol sin quemarte", "cuida", "La piel produce vitamina D con el sol. Evita las horas más fuertes.", "IOF"),
  shield("luz-casa", "💡", "Buena luz en pasillos y escaleras", "cuida", "Ver bien dónde pisas ayuda a prevenir caídas.", "OMS"),
  shield("equilibrio", "🧘", "Ejercicios de equilibrio con apoyo", "cuida", "El equilibrio ayuda a prevenir caídas. Hazlos cerca de una silla o una mesa.", "OMS"),
  shield("fractura-leve", "🦴", "Fractura con un golpe leve", "consulta", "Puede ser señal de huesos frágiles: cuéntaselo a tu médico.", "IOF"),
  shield("estatura", "📏", "Notar que perdiste estatura", "consulta", "Puede deberse a fracturas en la columna que no dieron dolor. Consulta.", "IOF"),
  shield("articulacion-caliente", "🔥", "Una articulación caliente e hinchada", "consulta", "Es una señal de inflamación que merece evaluación médica.", "SER"),
  shield("rigidez-prolongada", "⏳", "Rigidez de más de media hora al despertar", "consulta", "Puede indicar inflamación. Anótala y coméntala con tu médico.", "EULAR"),
  shield("fumar", "🚬", "Fumar", "no-ayuda", "El tabaco se asocia a huesos más frágiles. Pedir ayuda para dejarlo es un gran paso.", "IOF"),
  shield("sentado-todo-el-dia", "🛋️", "Pasar todo el día sentado", "no-ayuda", "Moverse un poco y levantarse cada cierto tiempo es mejor para músculos y huesos.", "OMS"),
  shield("alcohol-exceso", "🍺", "Beber alcohol en exceso", "no-ayuda", "Afecta el hueso y aumenta el riesgo de caídas.", "IOF"),
  shield("automedicarse", "💊", "Automedicarse para el dolor", "no-ayuda", "Los antiinflamatorios frecuentes tienen riesgos. Consulta antes de tomarlos.", "SER"),
  shield("alfombras-sueltas", "🧶", "Dejar alfombras sueltas en el paso", "no-ayuda", "Son una causa frecuente de tropiezos. Mejor retirarlas o fijarlas.", "OMS"),
];

const plate = (id: string, emoji: string, name: string, nutrient: PlateItem["nutrient"], explanation: string, source: ContentSource): PlateItem => ({
  id,
  emoji,
  name,
  nutrient,
  explanation,
  source,
  reviewStatus: PENDING,
});

const PLATE: readonly PlateItem[] = [
  plate("leche", "🥛", "Leche", "calcio", "Los lácteos son una fuente conocida de calcio.", "IOF"),
  plate("yogur", "🥣", "Yogur", "calcio", "Aporta calcio y es fácil de incluir en el desayuno.", "IOF"),
  plate("queso-fresco", "🧀", "Queso fresco", "calcio", "Otro lácteo con calcio. Mejor en porciones moderadas.", "IOF"),
  plate("sardinas", "🐟", "Sardinas con espinas", "ambos", "Al comerse con espinas aportan calcio, y como pescado azul, también vitamina D.", "IOF"),
  plate("bonito", "🐠", "Bonito o caballa", "vitamina-d", "Los pescados azules aportan vitamina D.", "IOF"),
  plate("huevo", "🥚", "Huevo", "vitamina-d", "La yema aporta algo de vitamina D.", "IOF"),
  plate("brocoli", "🥦", "Brócoli", "calcio", "Algunas verduras de hoja y crucíferas aportan calcio.", "IOF"),
  plate("menestras", "🫘", "Menestras", "calcio", "Frejoles y otras menestras suman calcio y fibra.", "IOF"),
  plate("almendras", "🌰", "Almendras", "calcio", "Algunos frutos secos aportan calcio. Un puñado es suficiente.", "IOF"),
  plate("gaseosa", "🥤", "Gaseosa", "poco", "No aporta calcio ni vitamina D. Mejor agua.", "IOF"),
  plate("papas-fritas", "🍟", "Papas fritas", "poco", "No suman calcio ni vitamina D a tu plato.", "IOF"),
  plate("caramelos", "🍬", "Caramelos", "poco", "Solo aportan azúcar.", "IOF"),
  plate("pan-blanco", "🍞", "Pan blanco", "poco", "Aporta energía, pero poco calcio y nada de vitamina D.", "IOF"),
  plate("cafe", "☕", "Café", "poco", "No aporta calcio. Si lo tomas, que sea con moderación.", "IOF"),
];

const spot = (id: string, label: string, isRisk: boolean, x: number, y: number, explanation: string): HomeSpot => ({
  id,
  label,
  isRisk,
  x,
  y,
  explanation,
  source: "OMS",
  reviewStatus: PENDING,
});

const HOME: readonly HomeSpot[] = [
  spot("alfombra-suelta", "Alfombra con el borde levantado", true, 30, 82, "Un borde levantado hace tropezar. Fíjala o retírala."),
  spot("cable-en-el-paso", "Cable cruzando el paso", true, 52, 88, "Los cables en el suelo provocan tropiezos. Pásalos junto a la pared."),
  spot("lampara-apagada", "Pasillo oscuro", true, 12, 30, "Sin luz no ves dónde pisas. Usa una luz o un interruptor cerca."),
  spot("escalera-sin-pasamanos", "Escalera sin pasamanos", true, 20, 58, "Un pasamanos firme da apoyo al subir y bajar."),
  spot("piso-mojado", "Piso del baño mojado", true, 80, 86, "El piso mojado resbala. Sécalo y usa una alfombra antideslizante."),
  spot("chinelas-sueltas", "Chinelas sueltas y gastadas", true, 64, 80, "Mejor calzado cerrado con suela que no resbale."),
  spot("estante-alto", "Cosas en un estante muy alto", true, 46, 18, "Subirse a un banquito es riesgoso. Pon lo que usas a la altura de la mano."),
  spot("luz-de-noche", "Luz de noche encendida", false, 38, 50, "¡Bien! Una luz de noche ayuda a ir al baño sin tropezar."),
  spot("barra-de-apoyo", "Barra de apoyo en el baño", false, 88, 48, "¡Bien! La barra da un apoyo firme al entrar y salir de la ducha."),
  spot("silla-con-brazos", "Silla firme con brazos", false, 60, 56, "¡Bien! Los brazos de la silla ayudan a sentarse y levantarse."),
];

const pair = (id: string, term: string, match: string, explanation: string, source: ContentSource): MemoryPair => ({
  id,
  term,
  match,
  explanation,
  source,
  reviewStatus: PENDING,
});

const MEMORY: readonly MemoryPair[] = [
  pair("dmo", "DMO", "Mide la densidad del hueso", "La densitometría mide la densidad mineral ósea (DMO).", "IOF"),
  pair("t-score", "T-score", "Compara con un adulto joven", "El T-score compara tu hueso con el de un adulto joven sano.", "OMS"),
  pair("calcio", "Calcio", "Mineral principal del hueso", "El calcio es uno de los minerales que dan resistencia al hueso.", "IOF"),
  pair("vitamina-d", "Vitamina D", "Ayuda a aprovechar el calcio", "La vitamina D ayuda al cuerpo a absorber el calcio de los alimentos.", "IOF"),
  pair("cartilago", "Cartílago", "Cubre los extremos del hueso", "Es el tejido liso que recubre los huesos dentro de la articulación.", "ACR"),
  pair("gota", "Gota", "Cristales de ácido úrico", "La gota se produce por cristales de ácido úrico en una articulación.", "ACR"),
  pair("reumatologo", "Reumatólogo", "Especialista en articulaciones", "Atiende enfermedades de articulaciones, huesos y autoinmunes.", "SER"),
  pair("rigidez", "Rigidez matutina", "Articulaciones duras al despertar", "Cuánto dura ayuda al médico a orientar el diagnóstico.", "EULAR"),
];

const quiz = (id: string, level: QuizItem["level"], question: string, options: string[], explanation: string, source: ContentSource): QuizItem => ({
  id,
  level,
  question,
  options,
  answerIndex: 0,
  explanation,
  source,
  reviewStatus: PENDING,
});

// La respuesta correcta se escribe primero; el juego baraja las opciones al mostrarlas.
const QUIZ: readonly QuizItem[] = [
  quiz("examen-densidad", 1, "¿Qué examen mide la densidad de los huesos?", ["Densitometría ósea", "Radiografía de tórax", "Análisis de orina"], "La densitometría ósea (DMO) mide la densidad mineral del hueso.", "IOF"),
  quiz("alimento-calcio", 1, "¿Cuál de estos alimentos aporta calcio?", ["Yogur", "Gaseosa", "Caramelos"], "Los lácteos como el yogur son fuente de calcio.", "IOF"),
  quiz("sol-vitamina", 1, "¿Qué ayuda a la piel a producir vitamina D?", ["La luz del sol", "El agua fría", "El aire acondicionado"], "La piel produce vitamina D con la luz solar, sin necesidad de quemarse.", "IOF"),
  quiz("casa-caidas", 1, "¿Qué cambio en casa ayuda a prevenir caídas?", ["Buena iluminación", "Alfombras sueltas", "Cables en el paso"], "Ver bien dónde pisas reduce tropiezos y caídas.", "OMS"),
  quiz("especialista", 1, "¿Qué especialista atiende las enfermedades de las articulaciones?", ["Reumatólogo", "Oftalmólogo", "Dermatólogo"], "El reumatólogo atiende articulaciones, huesos y enfermedades autoinmunes.", "SER"),
  quiz("osteopenia-rango", 2, "Según la OMS, ¿qué T-score corresponde a osteopenia?", ["Menos de -1.0 y más de -2.5", "-1.0 o más", "-2.5 o menos"], "Osteopenia es un T-score por debajo de -1.0 y por encima de -2.5. Con -1.0 o más es normal.", "OMS"),
  quiz("zonas-dmo", 2, "¿Qué zonas mide habitualmente la densitometría?", ["Columna lumbar y cadera", "Manos y pies", "Cráneo"], "Se mide la columna lumbar y la cadera, importantes para el riesgo de fractura.", "IOF"),
  quiz("gota-zona", 2, "¿Dónde suele empezar un ataque de gota?", ["En el dedo gordo del pie", "En la oreja", "En el codo"], "El dedo gordo del pie es la zona más típica del primer ataque.", "ACR"),
  quiz("ar-zonas", 2, "¿Qué suele afectar la artritis reumatoide?", ["Manos y pies, en ambos lados", "Solo una rodilla", "Solo la espalda"], "Suele afectar articulaciones pequeñas de manos y pies, en ambos lados.", "EULAR"),
  quiz("rigidez-inflamacion", 2, "Una rigidez de la mañana de más de media hora puede indicar…", ["Inflamación: conviene consultar", "Que todo está bien", "Solo que dormiste poco"], "La rigidez prolongada puede ser inflamatoria. Coméntalo con tu médico.", "EULAR"),
  quiz("quien-t-score", 3, "¿En quiénes se usa el T-score para clasificar?", ["Mujeres posmenopáusicas y hombres de 50 o más", "Niños y adolescentes", "Todas las personas por igual"], "En personas más jóvenes el médico usa el Z-score.", "OMS"),
  quiz("menos-dos-cinco", 3, "Un T-score de -2.5 exacto corresponde a…", ["Osteoporosis", "Osteopenia", "Resultado normal"], "La OMS define osteoporosis con un T-score de -2.5 o menos: -2.5 exacto ya lo es.", "OMS"),
  quiz("fragilidad", 3, "¿Qué es una fractura por fragilidad?", ["Una fractura con un golpe o caída leve", "Una fractura en un accidente de tránsito", "Una fractura jugando fútbol"], "Ocurre con golpes que un hueso sano suele resistir.", "IOF"),
  quiz("antecedente", 3, "¿Qué antecedente familiar aumenta el riesgo de fractura?", ["Fractura de cadera en papá o mamá", "Miopía en la familia", "Alergias en la familia"], "La fractura de cadera en los padres es un factor de riesgo reconocido.", "IOF"),
  quiz("lumbalgia-alarma", 3, "Dolor lumbar con debilidad en las piernas: ¿qué conviene?", ["Consultar pronto", "Esperar un mes", "Solo reposar en cama"], "La debilidad en las piernas es una señal de alarma: consulta pronto.", "OMS"),
];

export const RHEUMA_EDUCATION: RheumaEducation = rheumaEducationSchema.parse({
  myths: MYTHS,
  shield: SHIELD,
  plate: PLATE,
  home: HOME,
  memory: MEMORY,
  quiz: QUIZ,
});

/** Ítems educativos en total (todos llevan explicación y fuente). */
export function educationItemCount(data: RheumaEducation = RHEUMA_EDUCATION): number {
  return data.myths.length + data.shield.length + data.plate.length + data.home.length + data.memory.length + data.quiz.length;
}
