import type { LocaleTag } from "@/lib/i18n/config";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import type { Aspect } from "@/lib/types";

type SignSignature = {
  presence: string;
  relating: string;
  business: string;
  money: string;
};

export type DailyCopyContext = {
  moonTopic: string;
  sunTopic: string;
  rulerTopic: string;
  ruler: string;
  rulerSign: string;
  retrograde: boolean;
  aspectPhrase: string;
  elementPrompt: string;
  variant: number;
  signature: SignSignature;
};

export type DailyPhaseCopy = {
  period: "morning" | "afternoon" | "evening";
  theme: string;
  guidance: string;
};

type DailyCopy = {
  topics: readonly string[];
  elements: readonly string[];
  signatures: readonly SignSignature[];
  overview: (context: DailyCopyContext) => string;
  bottomLine: (context: DailyCopyContext) => string;
  relationships: (context: DailyCopyContext) => string;
  business: (context: DailyCopyContext) => string;
  money: (context: DailyCopyContext) => string;
  wellbeing: (context: DailyCopyContext) => string;
  opportunity: (context: DailyCopyContext) => string;
  caution: (context: DailyCopyContext) => string;
  question: (context: DailyCopyContext) => string;
  phases: (context: DailyCopyContext) => DailyPhaseCopy[];
};

function pick<T>(variant: number, choices: readonly T[]): T {
  return choices[variant % choices.length];
}

const shared = {
  "en-GB": {
    topics: [
      "identity and fresh starts",
      "resources and self-worth",
      "conversation and daily movement",
      "home and belonging",
      "creativity and pleasure",
      "routines and useful work",
      "partnership and reciprocity",
      "trust and shared resources",
      "learning and wider horizons",
      "career and public direction",
      "friends and future plans",
      "rest and inner renewal",
    ],
    elements: [
      "Give inspiration a practical next step before its heat disperses.",
      "Let steady progress count; refinement is more useful than urgency.",
      "Name the idea clearly, then notice which conversation gives it life.",
      "Treat sensitivity as information and choose where it deserves your attention.",
    ],
    signatures: [
      {
        presence: "Your instinct is to meet the day head-on",
        relating: "honest initiative without taking over",
        business: "a decisive first move",
        money: "quick choices checked against the real total",
      },
      {
        presence: "Your advantage is patience with what is still taking shape",
        relating: "steadiness that leaves room for another person",
        business: "durable value rather than visible speed",
        money: "security built one sensible choice at a time",
      },
      {
        presence: "Curiosity is your strongest instrument today",
        relating: "questions that open a real exchange",
        business: "connecting information others have kept separate",
        money: "reading the detail before changing direction",
      },
      {
        presence:
          "Your sensitivity catches the undertone before the words arrive",
        relating: "care that includes a clear boundary",
        business: "protecting the conditions in which good work can grow",
        money: "decisions that support both safety and ease",
      },
      {
        presence: "You are meant to be visible without performing for approval",
        relating: "warmth that makes appreciation specific",
        business: "creative leadership with a clear audience",
        money: "generosity that does not outrun the budget",
      },
      {
        presence: "Discernment helps you find the useful thread",
        relating: "practical care without unsolicited correction",
        business: "improving the system at its smallest weak point",
        money: "clean records and deliberate allocation",
      },
      {
        presence: "Balance comes from active adjustment, not perfect agreement",
        relating: "fairness that still names what you want",
        business: "negotiation with proportion and grace",
        money: "a choice that honours value on both sides",
      },
      {
        presence: "You can see where the real leverage is hidden",
        relating: "depth offered without testing another person",
        business: "focused strategy and confidential preparation",
        money: "clear terms around debt, ownership, or shared resources",
      },
      {
        presence: "The wider meaning matters, but today it needs a destination",
        relating: "candour tempered by genuine listening",
        business: "a bold direction translated into the next milestone",
        money: "investment in growth with a defined limit",
      },
      {
        presence: "The long view gives you authority over the immediate noise",
        relating: "reliability with enough softness to be felt",
        business: "structure, sequence, and accountable progress",
        money:
          "choices that strengthen the future rather than merely restrict the present",
      },
      {
        presence:
          "Your original angle is valuable because it changes the pattern",
        relating: "space for difference without emotional distance",
        business: "a useful experiment shared with the right network",
        money: "future-facing choices tested against present facts",
      },
      {
        presence: "Imagination is accurate when you give it a container",
        relating: "empathy that does not erase your own signal",
        business: "intuition translated into a brief, boundary, or schedule",
        money: "compassionate spending with a firm edge",
      },
    ],
    overview: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. The Moon foregrounds ${c.moonTopic}, while the Sun keeps ${c.sunTopic} as the larger destination. ${c.elementPrompt}`,
        `Begin with ${c.moonTopic}; that is where the day reveals its true temperature. ${c.signature.presence}, and the Sun’s emphasis on ${c.sunTopic} shows where to carry that awareness next.`,
        `${c.ruler} in ${c.rulerSign} directs your attention toward ${c.rulerTopic}. ${c.signature.presence}. Let the Moon’s movement through ${c.moonTopic} tell you what needs an answer now, not someday.`,
        `Today has two tempos: the Moon asks for responsiveness around ${c.moonTopic}, while the Sun asks for continuity around ${c.sunTopic}. ${c.signature.presence}; use that quality to join the two.`,
      ]),
    bottomLine: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. The immediate story is ${c.moonTopic}: respond to what is actually happening rather than to the version you rehearsed in advance. The Sun places the longer purpose in ${c.sunTopic}, so the best decision will satisfy the present moment without abandoning the larger direction. Your ruler, ${c.ruler} in ${c.rulerSign}, brings ${c.rulerTopic} into the method. ${c.retrograde ? "Revisit an unfinished choice, recover the useful part, and leave the old reflex behind." : "Choose a clear next step and let action clarify what thought alone cannot."} ${c.elementPrompt}`,
        `${c.signature.presence}. Put ${c.moonTopic} first on the agenda, even if another demand appears louder. That is where the day’s emotional intelligence lives, and the Sun’s focus on ${c.sunTopic} asks you to make this quality serve a larger aim. With ${c.ruler} moving through ${c.rulerSign}, progress comes through ${c.rulerTopic}. ${c.retrograde ? "The strongest move is a considered return: check the premise, revise the terms, then continue." : "Momentum grows when the next move is specific enough to complete today."} Keep the day human-sized; one well-placed choice can reorganise everything that follows.`,
        `${c.signature.presence}. ${c.ruler} sets today’s pace from ${c.rulerSign}, placing ${c.rulerTopic} at the centre of your method. The Moon makes ${c.moonTopic} impossible to ignore, while the Sun illuminates ${c.sunTopic} as the reason behind the effort. Do not force those themes to compete. Let the Moon identify the live need, then let the Sun decide what deserves staying power. ${c.retrograde ? "A revision carries more wisdom than a dramatic restart." : "Direct movement is available, provided the destination is named clearly."} ${c.elementPrompt}`,
        `${c.signature.presence}. The day turns on a useful contrast. Your instincts are pulled toward ${c.moonTopic}, yet the enduring invitation concerns ${c.sunTopic}; your distinctive way of meeting the world can bridge them. Your ruler, ${c.ruler} in ${c.rulerSign}, says the bridge is built through ${c.rulerTopic}. ${c.retrograde ? "Slow down wherever an old agreement or assumption has returned for review." : "Move once the practical terms match the intention."} By evening, success will look less like having done everything and more like having protected what matters most.`,
      ]),
    relationships: (c) =>
      pick(c.variant, [
        `Bring ${c.signature.relating} into your closest exchanges. The Moon’s emphasis on ${c.moonTopic} can make the first feeling arrive with unusual force, but it is information, not the whole conversation. Say what you need in one clean sentence, then make room for an answer you did not script. ${c.ruler} in ${c.rulerSign} ${c.retrograde ? "favours repairing the meaning of an earlier exchange before adding a new promise" : "supports present-tense honesty and agreements that can be kept"}.`,
        `Connection improves when you practise ${c.signature.relating}. Around ${c.moonTopic}, notice whether you are asking for closeness, clarity, reassurance, or space; naming the right need prevents unnecessary drama. The Sun’s focus on ${c.sunTopic} also reveals which relationship can support the longer journey. Offer attention where reciprocity is visible, and do not confuse familiarity with consent.`,
        `Let another person encounter the real you through ${c.signature.relating}. Today is not served by hints or private tests. ${c.ruler} in ${c.rulerSign} puts ${c.rulerTopic} into the relational field, so practical details may carry more meaning than grand declarations. ${c.retrograde ? "An old subject can be handled differently if you listen for what has changed." : "A small, timely gesture can make trust tangible."}`,
        `The relational task is balance: honour the Moon’s sensitivity around ${c.moonTopic} without making another person responsible for regulating it. Your most magnetic quality is ${c.signature.relating}. Use it to turn reaction into dialogue. The Sun’s attention to ${c.sunTopic} favours bonds that respect where each person is going, not only how comfortable the moment feels.`,
      ]),
    business: (c) =>
      pick(c.variant, [
        `Your commercial advantage lies in ${c.signature.business}. Put it to work in the area of ${c.rulerTopic}. ${c.aspectPhrase ? `${c.aspectPhrase}; treat the tension as useful intelligence about timing, scope, or responsibility.` : "The sky is not asking for complication, so define the next deliverable and finish it."} Keep meetings tied to decisions, translate ideas into ownership, and leave a written trail for anything that matters.`,
        `Business moves through ${c.rulerTopic} today, and ${c.signature.business} is the right operating principle. Before adding a new task, identify the result that would materially improve the week. ${c.aspectPhrase ? `${c.aspectPhrase}; a competing priority can expose a flaw in the original plan without invalidating the plan itself.` : "A quiet block of uninterrupted work will produce more than constant availability."}`,
        `Lead with ${c.signature.business}. The Sun’s emphasis on ${c.sunTopic} clarifies the strategic purpose, while the Moon’s movement through ${c.moonTopic} shows what the team, client, or workflow needs right now. ${c.retrograde ? "Review assumptions and recover missing context before committing resources." : "Make the decision at the level where the facts are clearest."} Progress should be measurable by day’s end, even if it is modest.`,
        `Treat ${c.rulerTopic} as the day’s working desk. Your ruler in ${c.rulerSign} rewards ${c.signature.business}, especially where a vague intention needs a deadline, owner, or next action. ${c.aspectPhrase ? `${c.aspectPhrase}; do not smooth over the disagreement until it has revealed the better design.` : "Simple coordination is enough to restore momentum."} Protect the work that compounds instead of merely looking busy.`,
      ]),
    money: (c) =>
      pick(c.variant, [
        `Use ${c.signature.money} as today’s financial rule. The Moon can make choices around ${c.moonTopic} feel urgent, so separate the emotional reason for a purchase from its practical value. Look at the exact number, the renewal date, and the opportunity cost. The Sun’s focus on ${c.sunTopic} favours spending that supports the longer direction and declining costs that exist mainly to preserve an outdated identity.`,
        `Money asks for proportion rather than deprivation. Practise ${c.signature.money}, then review one recurring expense or shared obligation connected with ${c.rulerTopic}. ${c.retrograde ? "A refund, correction, renegotiation, or delayed decision may be wiser than a new commitment." : "A clear yes or no is better than an open-ended maybe with a price attached."} Keep generosity inside terms you can sustain.`,
        `The useful financial question is not simply “Can I afford it?” but “What does this choice strengthen?” Today, ${c.signature.money} gives the answer texture. The Sun points toward ${c.sunTopic}; let that priority shape allocation. If the Moon stirs insecurity around ${c.moonTopic}, return to facts before acting. One transparent conversation about price, contribution, or ownership can prevent a larger misunderstanding.`,
        `Bring the numbers into daylight. ${c.signature.money} helps you protect both present needs and future room to move. With ${c.ruler} in ${c.rulerSign}, resources are best directed toward ${c.rulerTopic}; however, value must be demonstrated rather than assumed. Confirm the total cost, clarify who carries which obligation, and allow a pause before any decision driven by mood or social pressure.`,
      ]),
    wellbeing: (c) =>
      `Protect enough quiet to distinguish your own rhythm from the atmosphere around you. A small ritual connected with ${c.moonTopic} can restore steadiness today.`,
    opportunity: (c) =>
      pick(c.variant, [
        `Lead with ${c.signature.business}. One concrete move around ${c.sunTopic} can establish a direction that others understand and trust.`,
        `A door opens through ${c.rulerTopic}. Meet the useful invitation already in front of you with ${c.signature.business}, then give it your full attention.`,
        `Say yes to the part of ${c.sunTopic} that asks for genuine participation. ${c.signature.business} will carry the idea further than waiting for perfect conditions.`,
        `Turn today’s awareness of ${c.moonTopic} into momentum. A timely conversation or practical gesture can make ${c.sunTopic} feel possible rather than distant.`,
      ]),
    caution: (c) =>
      `Do not treat a passing mood as a final verdict, especially around ${c.moonTopic}.`,
    question: (c) =>
      pick(c.variant, [
        `Where would ${c.signature.relating} change the pattern around ${c.moonTopic}?`,
        `What are you ready to build in ${c.sunTopic} once you stop waiting for complete certainty?`,
        `Which truth about ${c.rulerTopic} deserves a direct answer before the day closes?`,
        `Where are you being invited to choose ${c.signature.business} instead of repeating a familiar habit?`,
      ]),
    phases: (c) => [
      {
        period: "morning",
        theme: c.moonTopic,
        guidance: pick(c.variant, [
          `Take the emotional temperature before setting the pace. One quiet check-in will show what needs care first.`,
          `Begin with the task or conversation that creates inner space. Do not spend the first hour reacting to every signal.`,
          `Name the live need, then choose one action small enough to complete before momentum scatters.`,
          `Let observation come before response. The morning reveals more when you do not rush to define it.`,
        ]),
      },
      {
        period: "afternoon",
        theme: c.rulerTopic,
        guidance: pick(c.variant + 1, [
          `Turn insight into a decision, owner, or deadline. This is the day’s strongest window for practical movement.`,
          `Use the middle of the day for the exchange that needs clarity and a visible next step.`,
          `Concentrate effort where it can compound; activity without direction will only dilute the signal.`,
          `Test the plan against real conditions, adjust once, and continue without over-explaining.`,
        ]),
      },
      {
        period: "evening",
        theme: c.sunTopic,
        guidance: pick(c.variant + 2, [
          `Notice what deserves to continue tomorrow and release the rest without making it a failure.`,
          `Close the loop that matters most, then let the day settle before drawing conclusions.`,
          `Choose restoration that returns you to yourself rather than simple distraction.`,
          `Gather the meaning of the day: what changed, what held, and what now has a clearer direction?`,
        ]),
      },
    ],
  },
  "es-ES": {
    topics: [
      "la identidad y los nuevos comienzos",
      "los recursos y la autoestima",
      "la conversación y el movimiento cotidiano",
      "el hogar y el sentido de pertenencia",
      "la creatividad y el placer",
      "las rutinas y el trabajo útil",
      "la pareja y la reciprocidad",
      "la confianza y los recursos compartidos",
      "el aprendizaje y los horizontes más amplios",
      "la vocación y la dirección pública",
      "las amistades y los planes de futuro",
      "el descanso y la renovación interior",
    ],
    elements: [
      "Da a la inspiración un próximo paso concreto antes de que se disperse su fuego.",
      "Valora el progreso constante; perfeccionar resulta más útil que apresurarse.",
      "Nombra la idea con claridad y observa qué conversación le da vida.",
      "Trata la sensibilidad como información y elige dónde merece tu atención.",
    ],
    signatures: [
      {
        presence: "Tu instinto es afrontar el día de frente",
        relating: "una iniciativa sincera que no invada",
        business: "un primer paso decisivo",
        money: "decisiones rápidas contrastadas con el total real",
      },
      {
        presence: "Tu ventaja está en dar tiempo a lo que aún toma forma",
        relating: "una constancia que deja espacio al otro",
        business: "valor duradero en vez de velocidad visible",
        money: "seguridad creada con decisiones sensatas",
      },
      {
        presence: "La curiosidad es hoy tu instrumento más preciso",
        relating: "preguntas que abren un intercambio real",
        business: "conectar información que otros mantienen separada",
        money: "leer los detalles antes de cambiar de rumbo",
      },
      {
        presence: "Tu sensibilidad capta el trasfondo antes que las palabras",
        relating: "cuidado acompañado de límites claros",
        business: "proteger las condiciones donde crece el buen trabajo",
        money: "decisiones que sostienen seguridad y tranquilidad",
      },
      {
        presence:
          "Te corresponde ser visible sin actuar para obtener aprobación",
        relating: "calidez que expresa un reconocimiento concreto",
        business: "liderazgo creativo con un público claro",
        money: "generosidad que no rebasa el presupuesto",
      },
      {
        presence: "Tu discernimiento encuentra el hilo útil",
        relating: "ayuda práctica sin correcciones no solicitadas",
        business: "mejorar el punto débil más pequeño del sistema",
        money: "registros claros y asignación deliberada",
      },
      {
        presence:
          "El equilibrio nace del ajuste activo, no del acuerdo perfecto",
        relating: "justicia que también nombra lo que deseas",
        business: "negociación con proporción y elegancia",
        money: "una elección que respeta el valor de ambas partes",
      },
      {
        presence: "Puedes ver dónde se oculta la verdadera influencia",
        relating: "profundidad sin poner a prueba al otro",
        business: "estrategia enfocada y preparación confidencial",
        money: "términos claros sobre deuda, propiedad o recursos compartidos",
      },
      {
        presence: "El sentido amplio importa, pero hoy necesita un destino",
        relating: "franqueza acompañada de escucha genuina",
        business: "una dirección audaz convertida en el siguiente hito",
        money: "inversión en crecimiento con un límite definido",
      },
      {
        presence:
          "La visión a largo plazo te da autoridad sobre el ruido inmediato",
        relating: "fiabilidad con suficiente ternura para sentirse",
        business: "estructura, secuencia y progreso responsable",
        money: "elecciones que fortalecen el futuro",
      },
      {
        presence: "Tu ángulo original vale porque cambia el patrón",
        relating: "espacio para la diferencia sin distancia emocional",
        business: "un experimento útil compartido con la red adecuada",
        money: "decisiones de futuro contrastadas con hechos presentes",
      },
      {
        presence: "La imaginación acierta cuando le das un marco",
        relating: "empatía que no borra tu propia señal",
        business: "intuición convertida en encargo, límite o calendario",
        money: "gasto compasivo con un borde firme",
      },
    ],
    overview: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. La Luna destaca ${c.moonTopic}, mientras el Sol mantiene ${c.sunTopic} como destino mayor. ${c.elementPrompt}`,
        `Comienza por ${c.moonTopic}; ahí se revela la temperatura real del día. ${c.signature.presence}, y el Sol señala ${c.sunTopic} como el siguiente horizonte.`,
        `${c.ruler} en ${c.rulerSign} dirige la atención hacia ${c.rulerTopic}. ${c.signature.presence}. Deja que la Luna indique qué necesita respuesta ahora.`,
        `Hoy conviven dos ritmos: la Luna pide respuesta en ${c.moonTopic} y el Sol continuidad en ${c.sunTopic}. ${c.signature.presence}; une ambos impulsos.`,
      ]),
    bottomLine: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. La historia inmediata es ${c.moonTopic}: responde a lo que sucede de verdad, no a la versión que habías ensayado. El Sol sitúa el propósito más amplio en ${c.sunTopic}, de modo que la mejor decisión atenderá el presente sin abandonar la dirección mayor. Tu regente, ${c.ruler} en ${c.rulerSign}, incorpora ${c.rulerTopic} al método. ${c.retrograde ? "Retoma una decisión pendiente, recupera lo útil y deja atrás el reflejo antiguo." : "Elige un siguiente paso claro y permite que la acción aclare lo que el pensamiento no puede."} ${c.elementPrompt}`,
        `${c.signature.presence}. Coloca ${c.moonTopic} al principio de la agenda, aunque otra demanda parezca más ruidosa. Ahí vive la inteligencia emocional del día, y el Sol en ${c.sunTopic} pide que esa cualidad sirva a un objetivo mayor. Con ${c.ruler} en ${c.rulerSign}, el avance llega mediante ${c.rulerTopic}. ${c.retrograde ? "Lo más fuerte es volver con criterio: revisa la premisa, ajusta los términos y continúa." : "El impulso crece cuando el próximo movimiento puede completarse hoy."} Una elección bien situada puede ordenar todo lo que sigue.`,
        `${c.signature.presence}. ${c.ruler} marca el ritmo desde ${c.rulerSign} y coloca ${c.rulerTopic} en el centro del método. La Luna vuelve imposible ignorar ${c.moonTopic}, mientras el Sol ilumina ${c.sunTopic} como razón del esfuerzo. No hagas competir ambos temas: deja que la Luna identifique la necesidad viva y que el Sol decida qué merece permanencia. ${c.retrograde ? "Una revisión contiene más sabiduría que un reinicio dramático." : "Hay movimiento directo si nombras el destino con claridad."} ${c.elementPrompt}`,
        `${c.signature.presence}. El día gira sobre un contraste útil. Tus instintos se orientan a ${c.moonTopic}, pero la invitación duradera se refiere a ${c.sunTopic}; tu forma singular de estar en el mundo puede tender el puente. ${c.ruler} en ${c.rulerSign} indica que se construye a través de ${c.rulerTopic}. ${c.retrograde ? "Reduce el ritmo cuando un acuerdo o supuesto antiguo vuelva a revisión." : "Avanza cuando los términos prácticos coincidan con la intención."} Al anochecer, el éxito será haber protegido lo esencial.`,
      ]),
    relationships: (c) =>
      pick(c.variant, [
        `Lleva ${c.signature.relating} a tus intercambios más cercanos. La Luna intensifica ${c.moonTopic}; el primer sentimiento aporta información, pero no constituye toda la conversación. Expresa tu necesidad en una frase clara y deja espacio para una respuesta no prevista. ${c.ruler} en ${c.rulerSign} favorece ${c.retrograde ? "reparar el sentido de un diálogo anterior" : "acuerdos honestos que sí pueden cumplirse"}.`,
        `La conexión mejora cuando practicas ${c.signature.relating}. En ${c.moonTopic}, distingue si buscas cercanía, claridad, seguridad o espacio. Nombrar la necesidad correcta evita drama innecesario. El Sol en ${c.sunTopic} muestra qué vínculo puede acompañar el camino largo.`,
        `Permite que la otra persona te encuentre mediante ${c.signature.relating}. Hoy no sirven las indirectas ni las pruebas privadas. ${c.ruler} en ${c.rulerSign} introduce ${c.rulerTopic} en el vínculo: los detalles prácticos pueden decir más que una gran declaración.`,
        `La tarea relacional es honrar la sensibilidad de ${c.moonTopic} sin pedir al otro que la regule. Tu cualidad magnética es ${c.signature.relating}. Úsala para convertir la reacción en diálogo y favorecer vínculos que respeten el rumbo de cada persona.`,
      ]),
    business: (c) =>
      pick(c.variant, [
        `Tu ventaja profesional está en ${c.signature.business}. Aplícala a ${c.rulerTopic}. ${c.aspectPhrase ? `${c.aspectPhrase}; considera la tensión como información sobre plazos, alcance o responsabilidad.` : "Define el siguiente resultado y termínalo sin añadir complejidad."} Vincula las reuniones a decisiones y deja constancia escrita de lo importante.`,
        `Los negocios se mueven hoy mediante ${c.rulerTopic}; ${c.signature.business} es el principio operativo adecuado. Antes de añadir tareas, identifica el resultado que mejoraría materialmente la semana. ${c.aspectPhrase ? `${c.aspectPhrase}; una prioridad rival puede revelar un defecto sin invalidar el plan.` : "Un bloque de trabajo sin interrupciones rendirá más que la disponibilidad constante."}`,
        `Lidera con ${c.signature.business}. El Sol en ${c.sunTopic} aclara el propósito estratégico y la Luna en ${c.moonTopic} revela lo que necesitan el equipo, el cliente o el proceso. ${c.retrograde ? "Revisa supuestos antes de comprometer recursos." : "Decide en el nivel donde los hechos sean más claros."} Deja un avance medible.`,
        `Trata ${c.rulerTopic} como la mesa de trabajo del día. Tu regente en ${c.rulerSign} recompensa ${c.signature.business} allí donde una intención vaga necesita plazo, responsable o siguiente acción. ${c.aspectPhrase ? `${c.aspectPhrase}; deja que la diferencia revele un diseño mejor.` : "Una coordinación sencilla basta para recuperar impulso."}`,
      ]),
    money: (c) =>
      pick(c.variant, [
        `Usa ${c.signature.money} como regla financiera. La Luna puede volver urgentes las decisiones sobre ${c.moonTopic}; separa el motivo emocional de una compra de su valor práctico. Mira la cifra exacta, la renovación y el coste de oportunidad. El Sol en ${c.sunTopic} favorece gastos que apoyan la dirección larga.`,
        `El dinero pide proporción, no privación. Practica ${c.signature.money} y revisa un gasto recurrente u obligación compartida vinculada con ${c.rulerTopic}. ${c.retrograde ? "Un reembolso, corrección o renegociación puede ser más sabio que un nuevo compromiso." : "Un sí o un no claro supera a un quizá indefinido con precio."}`,
        `La pregunta útil no es solo «¿puedo pagarlo?», sino «¿qué fortalece esta elección?». ${c.signature.money} da textura a la respuesta. El Sol apunta a ${c.sunTopic}; deja que esa prioridad ordene la asignación. Si la Luna agita inseguridad en ${c.moonTopic}, vuelve a los hechos.`,
        `Pon las cifras a la luz. ${c.signature.money} protege las necesidades presentes y el margen futuro. Con ${c.ruler} en ${c.rulerSign}, dirige recursos hacia ${c.rulerTopic}, pero exige que el valor se demuestre. Confirma el coste total, aclara las obligaciones y pausa ante la presión social.`,
      ]),
    wellbeing: (c) =>
      `Protege suficiente silencio para distinguir tu ritmo del ambiente. Un pequeño ritual relacionado con ${c.moonTopic} puede devolverte estabilidad.`,
    opportunity: (c) =>
      pick(c.variant, [
        `Avanza con ${c.signature.business}. Un movimiento concreto en ${c.sunTopic} puede fijar una dirección que los demás comprendan y apoyen.`,
        `Se abre una puerta a través de ${c.rulerTopic}. Atiende la invitación útil que ya tienes delante y deja que tu forma natural de actuar se convierta en ventaja.`,
        `Di que sí a la parte de ${c.sunTopic} que pide participación verdadera. ${c.signature.business} llevará la idea más lejos que esperar condiciones perfectas.`,
        `Convierte la conciencia sobre ${c.moonTopic} en impulso. Una conversación o un gesto oportuno puede acercar ${c.sunTopic} a la realidad.`,
      ]),
    caution: (c) =>
      `No conviertas un estado de ánimo pasajero en un veredicto definitivo sobre ${c.moonTopic}.`,
    question: (c) =>
      pick(c.variant, [
        `¿Dónde cambiaría el patrón de ${c.moonTopic} si practicaras ${c.signature.relating}?`,
        `¿Qué estás preparado para construir en ${c.sunTopic} cuando dejes de esperar una certeza completa?`,
        `¿Qué verdad sobre ${c.rulerTopic} merece una respuesta directa antes de terminar el día?`,
        `¿Dónde se te invita a elegir ${c.signature.business} en lugar de repetir una costumbre conocida?`,
      ]),
    phases: (c) => [
      {
        period: "morning",
        theme: c.moonTopic,
        guidance: pick(c.variant, [
          "Toma la temperatura emocional antes de marcar el ritmo.",
          "Empieza por lo que crea espacio interior, no por cada señal externa.",
          "Nombra la necesidad viva y completa una acción pequeña.",
          "Observa antes de responder; la mañana revelará más.",
        ]),
      },
      {
        period: "afternoon",
        theme: c.rulerTopic,
        guidance: pick(c.variant + 1, [
          "Convierte la idea en decisión, responsable o plazo.",
          "Usa el centro del día para el intercambio que necesita claridad.",
          "Concentra el esfuerzo donde pueda acumular valor.",
          "Contrasta el plan con la realidad, ajusta y continúa.",
        ]),
      },
      {
        period: "evening",
        theme: c.sunTopic,
        guidance: pick(c.variant + 2, [
          "Decide qué merece continuar mañana y suelta el resto.",
          "Cierra el ciclo más importante antes de sacar conclusiones.",
          "Elige una restauración que te devuelva a ti.",
          "Recoge el sentido del día: qué cambió y qué se aclaró.",
        ]),
      },
    ],
  },
  "fr-FR": {
    topics: [
      "l’identité et les nouveaux départs",
      "les ressources et l’estime de soi",
      "les échanges et les déplacements quotidiens",
      "le foyer et l’appartenance",
      "la créativité et le plaisir",
      "les habitudes et le travail utile",
      "le partenariat et la réciprocité",
      "la confiance et les ressources partagées",
      "l’apprentissage et les horizons élargis",
      "la carrière et la direction publique",
      "les amitiés et les projets d’avenir",
      "le repos et le renouveau intérieur",
    ],
    elements: [
      "Donnez à l’inspiration une prochaine étape concrète avant que son feu ne se disperse.",
      "Accordez de la valeur aux progrès réguliers ; affiner est plus utile que se hâter.",
      "Nommez clairement l’idée, puis observez quelle conversation lui donne vie.",
      "Considérez la sensibilité comme une information et choisissez où elle mérite votre attention.",
    ],
    signatures: [
      {
        presence: "Votre instinct vous pousse à affronter la journée de face",
        relating: "une initiative sincère sans prendre toute la place",
        business: "un premier geste décisif",
        money: "des choix rapides vérifiés par le total réel",
      },
      {
        presence:
          "Votre avantage réside dans la patience accordée à ce qui prend forme",
        relating: "une constance qui laisse de la place à l’autre",
        business: "la valeur durable plutôt que la vitesse visible",
        money: "la sécurité bâtie par des choix raisonnés",
      },
      {
        presence:
          "La curiosité est aujourd’hui votre instrument le plus précis",
        relating: "des questions qui ouvrent un véritable échange",
        business: "relier des informations restées séparées",
        money: "lire les détails avant de changer de cap",
      },
      {
        presence: "Votre sensibilité perçoit le sous-texte avant les mots",
        relating: "une attention accompagnée d’une limite claire",
        business: "protéger les conditions d’un travail de qualité",
        money: "des décisions qui soutiennent sécurité et aisance",
      },
      {
        presence: "Vous pouvez être visible sans jouer pour l’approbation",
        relating: "une chaleur qui rend l’appréciation précise",
        business: "un leadership créatif orienté vers son public",
        money: "une générosité qui respecte le budget",
      },
      {
        presence: "Votre discernement trouve le fil utile",
        relating: "un soin pratique sans correction non sollicitée",
        business: "améliorer le plus petit point faible du système",
        money: "des comptes nets et une allocation délibérée",
      },
      {
        presence:
          "L’équilibre vient d’un ajustement actif, pas d’un accord parfait",
        relating: "l’équité qui nomme aussi votre désir",
        business: "la négociation avec mesure et grâce",
        money: "un choix qui honore la valeur des deux côtés",
      },
      {
        presence: "Vous voyez où se cache le véritable levier",
        relating: "la profondeur offerte sans mettre l’autre à l’épreuve",
        business: "une stratégie concentrée et une préparation discrète",
        money: "des termes clairs sur les dettes ou ressources partagées",
      },
      {
        presence:
          "Le sens général compte, mais il lui faut aujourd’hui une destination",
        relating: "la franchise tempérée par une écoute réelle",
        business: "une direction audacieuse traduite en prochaine étape",
        money: "un investissement dans la croissance avec une limite définie",
      },
      {
        presence:
          "La vision à long terme vous donne autorité sur le bruit immédiat",
        relating: "la fiabilité avec assez de douceur pour être ressentie",
        business: "structure, séquence et progrès responsable",
        money: "des choix qui renforcent l’avenir",
      },
      {
        presence:
          "Votre angle original a de la valeur parce qu’il change le motif",
        relating: "de la place pour la différence sans distance affective",
        business: "une expérience utile partagée avec le bon réseau",
        money: "des choix d’avenir testés par les faits présents",
      },
      {
        presence:
          "L’imagination devient juste lorsque vous lui donnez un cadre",
        relating: "l’empathie qui n’efface pas votre propre signal",
        business: "l’intuition traduite en consigne, limite ou calendrier",
        money: "une dépense compatissante avec une limite ferme",
      },
    ],
    overview: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. La Lune met en avant ${c.moonTopic}, tandis que le Soleil garde ${c.sunTopic} comme destination. ${c.elementPrompt}`,
        `Commencez par ${c.moonTopic} : c’est là que se révèle la température du jour. ${c.signature.presence}, puis le Soleil indique ${c.sunTopic} comme horizon.`,
        `${c.ruler} en ${c.rulerSign} dirige l’attention vers ${c.rulerTopic}. ${c.signature.presence}. Laissez la Lune montrer ce qui appelle une réponse immédiate.`,
        `Deux rythmes coexistent : la Lune demande une réponse autour de ${c.moonTopic}, le Soleil de la continuité autour de ${c.sunTopic}. ${c.signature.presence} ; reliez-les.`,
      ]),
    bottomLine: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. L’histoire immédiate concerne ${c.moonTopic} : répondez à ce qui se passe réellement, pas au scénario préparé. Le Soleil place le but durable dans ${c.sunTopic} ; la meilleure décision servira le présent sans abandonner la direction générale. Votre maître, ${c.ruler} en ${c.rulerSign}, introduit ${c.rulerTopic} dans la méthode. ${c.retrograde ? "Reprenez un choix inachevé, gardez ce qui reste utile et laissez l’ancien réflexe." : "Choisissez une prochaine étape claire et laissez l’action préciser ce que la pensée seule ne peut résoudre."} ${c.elementPrompt}`,
        `${c.signature.presence}. Placez ${c.moonTopic} en tête de l’ordre du jour, même si une autre demande paraît plus bruyante. C’est là que vit l’intelligence émotionnelle du jour, et le Soleil en ${c.sunTopic} demande que cette qualité serve un but plus large. Avec ${c.ruler} en ${c.rulerSign}, le progrès passe par ${c.rulerTopic}. ${c.retrograde ? "La force réside dans un retour réfléchi : vérifiez la prémisse, révisez les termes, puis continuez." : "L’élan grandit lorsque la prochaine action peut être achevée aujourd’hui."} Un choix juste peut réorganiser la suite.`,
        `${c.signature.presence}. ${c.ruler} donne le rythme depuis ${c.rulerSign}, plaçant ${c.rulerTopic} au centre de la méthode. La Lune rend ${c.moonTopic} impossible à ignorer, tandis que le Soleil éclaire ${c.sunTopic} comme raison de l’effort. Ne les mettez pas en concurrence : laissez la Lune nommer le besoin vivant et le Soleil choisir ce qui doit durer. ${c.retrograde ? "Une révision porte plus de sagesse qu’un redémarrage spectaculaire." : "Le mouvement direct est disponible si la destination est clairement nommée."} ${c.elementPrompt}`,
        `${c.signature.presence}. La journée repose sur un contraste utile. Vos instincts vont vers ${c.moonTopic}, tandis que l’invitation durable concerne ${c.sunTopic} ; votre manière singulière d’être au monde peut les relier. ${c.ruler} en ${c.rulerSign} dit que le pont passe par ${c.rulerTopic}. ${c.retrograde ? "Ralentissez lorsqu’un ancien accord revient en révision." : "Avancez lorsque les termes pratiques rejoignent l’intention."} Ce soir, la réussite sera d’avoir protégé l’essentiel.`,
      ]),
    relationships: (c) =>
      pick(c.variant, [
        `Apportez ${c.signature.relating} dans vos échanges proches. La Lune intensifie ${c.moonTopic} ; le premier sentiment informe, mais ne constitue pas toute la conversation. Nommez votre besoin en une phrase claire, puis laissez place à une réponse imprévue. ${c.ruler} en ${c.rulerSign} favorise ${c.retrograde ? "la réparation du sens d’un ancien échange" : "des accords honnêtes et tenables"}.`,
        `Le lien s’améliore lorsque vous pratiquez ${c.signature.relating}. Autour de ${c.moonTopic}, distinguez si vous cherchez proximité, clarté, assurance ou espace. Nommer le bon besoin évite un drame inutile. Le Soleil en ${c.sunTopic} révèle la relation qui peut soutenir la route longue.`,
        `Laissez l’autre vous rencontrer à travers ${c.signature.relating}. Les sous-entendus et les tests privés ne servent pas la journée. ${c.ruler} en ${c.rulerSign} introduit ${c.rulerTopic} dans le lien : les détails pratiques peuvent porter plus de sens qu’une grande déclaration.`,
        `La tâche relationnelle consiste à honorer la sensibilité autour de ${c.moonTopic} sans demander à l’autre de la réguler. Votre force magnétique est ${c.signature.relating}. Utilisez-la pour transformer la réaction en dialogue.`,
      ]),
    business: (c) =>
      pick(c.variant, [
        `Votre avantage professionnel réside dans ${c.signature.business}. Appliquez-le à ${c.rulerTopic}. ${c.aspectPhrase ? `${c.aspectPhrase} ; considérez la tension comme une information sur le calendrier ou les responsabilités.` : "Définissez le prochain résultat et terminez-le sans ajouter de complexité."} Liez les réunions aux décisions et gardez une trace écrite.`,
        `L’activité avance aujourd’hui par ${c.rulerTopic} ; ${c.signature.business} est le bon principe de fonctionnement. Avant d’ajouter une tâche, identifiez le résultat qui améliorerait réellement la semaine. ${c.aspectPhrase ? `${c.aspectPhrase} ; une priorité concurrente peut révéler un défaut sans invalider le plan.` : "Un temps de travail sans interruption sera plus productif qu’une disponibilité constante."}`,
        `Dirigez avec ${c.signature.business}. Le Soleil en ${c.sunTopic} clarifie le but stratégique, tandis que la Lune en ${c.moonTopic} montre le besoin du client, de l’équipe ou du processus. ${c.retrograde ? "Réexaminez les hypothèses avant d’engager des ressources." : "Décidez là où les faits sont les plus nets."} Rendez le progrès mesurable.`,
        `Faites de ${c.rulerTopic} votre table de travail. Votre maître en ${c.rulerSign} récompense ${c.signature.business} lorsqu’une intention vague a besoin d’un délai, d’un responsable ou d’une prochaine action. ${c.aspectPhrase ? `${c.aspectPhrase} ; laissez la différence révéler une meilleure conception.` : "Une coordination simple suffit à restaurer l’élan."}`,
      ]),
    money: (c) =>
      pick(c.variant, [
        `Faites de ${c.signature.money} votre règle financière. La Lune peut rendre urgents les choix autour de ${c.moonTopic} ; séparez la raison émotionnelle d’un achat de sa valeur pratique. Regardez le chiffre exact, le renouvellement et le coût d’opportunité. Le Soleil en ${c.sunTopic} favorise les dépenses qui servent la direction durable.`,
        `L’argent demande de la proportion, pas de la privation. Pratiquez ${c.signature.money}, puis examinez une dépense récurrente ou une obligation partagée liée à ${c.rulerTopic}. ${c.retrograde ? "Un remboursement, une correction ou une renégociation peut être plus sage qu’un nouvel engagement." : "Un oui ou un non clair vaut mieux qu’un peut-être indéfini assorti d’un prix."}`,
        `La question utile n’est pas seulement « puis-je me le permettre ? », mais « que renforce ce choix ? ». ${c.signature.money} donne sa texture à la réponse. Le Soleil vise ${c.sunTopic} ; laissez cette priorité guider l’allocation. Si la Lune réveille l’insécurité autour de ${c.moonTopic}, revenez aux faits.`,
        `Mettez les chiffres en pleine lumière. ${c.signature.money} protège les besoins présents et la marge future. Avec ${c.ruler} en ${c.rulerSign}, dirigez les ressources vers ${c.rulerTopic}, mais demandez que la valeur soit démontrée. Confirmez le coût total et clarifiez les obligations.`,
      ]),
    wellbeing: (c) =>
      `Préservez assez de calme pour distinguer votre rythme de l’atmosphère. Un petit rituel lié à ${c.moonTopic} peut rétablir votre stabilité.`,
    opportunity: (c) =>
      pick(c.variant, [
        `Avancez avec ${c.signature.business}. Un geste concret autour de ${c.sunTopic} peut établir une direction que les autres comprennent et soutiennent.`,
        `Une porte s’ouvre par ${c.rulerTopic}. Accordez votre attention à l’invitation utile déjà présente, puis faites de votre manière naturelle d’agir un avantage.`,
        `Dites oui à la part de ${c.sunTopic} qui demande une participation réelle. ${c.signature.business} portera l’idée plus loin que l’attente de conditions parfaites.`,
        `Transformez la conscience de ${c.moonTopic} en élan. Une conversation ou un geste opportun peut rapprocher ${c.sunTopic} de la réalité.`,
      ]),
    caution: (c) =>
      `Ne transformez pas une humeur passagère en verdict sur ${c.moonTopic}.`,
    question: (c) =>
      pick(c.variant, [
        `Que changerait ${c.signature.relating} dans le motif autour de ${c.moonTopic} ?`,
        `Qu’êtes-vous prêt à construire dans ${c.sunTopic} lorsque vous cessez d’attendre une certitude totale ?`,
        `Quelle vérité sur ${c.rulerTopic} mérite une réponse directe avant la fin du jour ?`,
        `Où êtes-vous invité à choisir ${c.signature.business} plutôt qu’à répéter une habitude familière ?`,
      ]),
    phases: (c) => [
      {
        period: "morning",
        theme: c.moonTopic,
        guidance: pick(c.variant, [
          "Prenez la température émotionnelle avant de fixer le rythme.",
          "Commencez par ce qui crée de l’espace intérieur.",
          "Nommez le besoin vivant et achevez une petite action.",
          "Observez avant de répondre ; le matin révélera davantage.",
        ]),
      },
      {
        period: "afternoon",
        theme: c.rulerTopic,
        guidance: pick(c.variant + 1, [
          "Transformez l’idée en décision, responsable ou délai.",
          "Utilisez le milieu du jour pour l’échange qui demande de la clarté.",
          "Concentrez l’effort là où il peut s’accumuler.",
          "Confrontez le plan au réel, ajustez, puis continuez.",
        ]),
      },
      {
        period: "evening",
        theme: c.sunTopic,
        guidance: pick(c.variant + 2, [
          "Décidez ce qui mérite de continuer demain.",
          "Fermez la boucle essentielle avant de conclure.",
          "Choisissez une restauration qui vous ramène à vous.",
          "Recueillez le sens du jour : ce qui a changé et ce qui s’est éclairci.",
        ]),
      },
    ],
  },
  "de-DE": {
    topics: [
      "Identität und Neuanfänge",
      "Ressourcen und Selbstwert",
      "Gespräche und alltägliche Bewegung",
      "Zuhause und Zugehörigkeit",
      "Kreativität und Freude",
      "Routinen und sinnvolle Arbeit",
      "Partnerschaft und Gegenseitigkeit",
      "Vertrauen und gemeinsame Ressourcen",
      "Lernen und weitere Horizonte",
      "Beruf und öffentliche Ausrichtung",
      "Freundschaften und Zukunftspläne",
      "Ruhe und innere Erneuerung",
    ],
    elements: [
      "Gib der Inspiration einen praktischen nächsten Schritt, bevor sich ihre Glut zerstreut.",
      "Lass stetigen Fortschritt zählen; Verfeinerung ist hilfreicher als Eile.",
      "Benenne die Idee klar und achte darauf, welches Gespräch sie lebendig macht.",
      "Behandle Sensibilität als Information und entscheide, wo sie deine Aufmerksamkeit verdient.",
    ],
    signatures: [
      {
        presence: "Dein Instinkt will dem Tag unmittelbar begegnen",
        relating: "ehrliche Initiative, ohne alles zu bestimmen",
        business: "einem entschlossenen ersten Schritt",
        money:
          "schnellen Entscheidungen, die an der wirklichen Summe geprüft werden",
      },
      {
        presence:
          "Dein Vorteil liegt in der Geduld mit dem, was noch Gestalt annimmt",
        relating: "Beständigkeit, die dem Gegenüber Raum lässt",
        business: "dauerhaftem Wert statt sichtbarer Geschwindigkeit",
        money: "Sicherheit aus vernünftigen Einzelentscheidungen",
      },
      {
        presence: "Neugier ist heute dein präzisestes Instrument",
        relating: "Fragen, die einen echten Austausch öffnen",
        business: "dem Verbinden bisher getrennter Informationen",
        money: "genauem Lesen vor einem Richtungswechsel",
      },
      {
        presence: "Deine Sensibilität erfasst den Unterton vor den Worten",
        relating: "Fürsorge mit einer klaren Grenze",
        business: "dem Schutz guter Arbeitsbedingungen",
        money: "Entscheidungen, die Sicherheit und Leichtigkeit tragen",
      },
      {
        presence: "Du darfst sichtbar sein, ohne um Zustimmung zu spielen",
        relating: "Wärme, die Anerkennung konkret macht",
        business: "kreativer Führung mit einem klaren Publikum",
        money: "Großzügigkeit innerhalb des Budgets",
      },
      {
        presence: "Deine Urteilskraft findet den nützlichen Faden",
        relating: "praktischer Fürsorge ohne ungefragte Korrektur",
        business: "der Verbesserung am kleinsten Schwachpunkt",
        money: "klaren Aufzeichnungen und bewusster Zuteilung",
      },
      {
        presence: "Gleichgewicht entsteht durch aktives Nachjustieren",
        relating: "Fairness, die den eigenen Wunsch benennt",
        business: "Verhandlung mit Maß und Stil",
        money: "einer Wahl, die den Wert beider Seiten achtet",
      },
      {
        presence: "Du erkennst, wo die eigentliche Hebelwirkung verborgen ist",
        relating: "Tiefe, ohne das Gegenüber zu prüfen",
        business: "konzentrierter Strategie und diskreter Vorbereitung",
        money: "klaren Bedingungen für Schulden oder geteilte Mittel",
      },
      {
        presence: "Der größere Sinn braucht heute ein Ziel",
        relating: "Offenheit mit echtem Zuhören",
        business: "einer mutigen Richtung als nächstem Meilenstein",
        money: "Wachstumsinvestitionen mit festgelegter Grenze",
      },
      {
        presence:
          "Der lange Blick gibt dir Autorität über den unmittelbaren Lärm",
        relating: "Verlässlichkeit mit spürbarer Weichheit",
        business: "Struktur, Abfolge und verantwortlichem Fortschritt",
        money: "Entscheidungen, die die Zukunft stärken",
      },
      {
        presence:
          "Dein eigener Blickwinkel ist wertvoll, weil er das Muster verändert",
        relating: "Raum für Unterschiede ohne emotionale Distanz",
        business: "einem nützlichen Versuch im richtigen Netzwerk",
        money: "zukunftsgerichteten Ideen, geprüft an heutigen Fakten",
      },
      {
        presence: "Vorstellungskraft trifft, wenn du ihr einen Rahmen gibst",
        relating: "Mitgefühl, das dein eigenes Signal nicht auslöscht",
        business: "Intuition als Briefing, Grenze oder Zeitplan",
        money: "mitfühlenden Ausgaben mit fester Kante",
      },
    ],
    overview: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. Der Mond betont ${c.moonTopic}, während die Sonne ${c.sunTopic} als größeres Ziel hält. ${c.elementPrompt}`,
        `Beginne mit ${c.moonTopic}; dort zeigt sich die wahre Temperatur des Tages. ${c.signature.presence}, und die Sonne weist mit ${c.sunTopic} den nächsten Horizont.`,
        `${c.ruler} in ${c.rulerSign} lenkt die Aufmerksamkeit auf ${c.rulerTopic}. ${c.signature.presence}. Lass den Mond zeigen, was jetzt eine Antwort braucht.`,
        `Heute wirken zwei Tempi: Der Mond fordert Antwort bei ${c.moonTopic}, die Sonne Kontinuität bei ${c.sunTopic}. ${c.signature.presence}; verbinde beides.`,
      ]),
    bottomLine: (c) =>
      pick(c.variant, [
        `${c.signature.presence}. Die unmittelbare Geschichte heißt ${c.moonTopic}: Antworte auf das, was wirklich geschieht, nicht auf die vorab entworfene Version. Die Sonne setzt den längeren Zweck bei ${c.sunTopic}; die beste Entscheidung erfüllt den Moment, ohne die größere Richtung aufzugeben. Dein Herrscher ${c.ruler} in ${c.rulerSign} bringt ${c.rulerTopic} in die Methode. ${c.retrograde ? "Nimm eine unfertige Entscheidung wieder auf, bewahre das Nützliche und lass den alten Reflex zurück." : "Wähle einen klaren nächsten Schritt und lass Handlung klären, was Denken allein nicht lösen kann."} ${c.elementPrompt}`,
        `${c.signature.presence}. Setze ${c.moonTopic} an den Anfang, auch wenn eine andere Forderung lauter erscheint. Dort liegt die emotionale Intelligenz des Tages, doch die Sonne bei ${c.sunTopic} will diese Qualität einem größeren Ziel dienen lassen. Mit ${c.ruler} in ${c.rulerSign} entsteht Fortschritt durch ${c.rulerTopic}. ${c.retrograde ? "Die stärkste Bewegung ist eine bedachte Rückkehr: Prüfe die Annahme, ändere die Bedingungen und gehe weiter." : "Schwung wächst, wenn der nächste Schritt heute abschließbar ist."} Eine gut gesetzte Wahl ordnet alles Weitere.`,
        `${c.signature.presence}. ${c.ruler} gibt aus ${c.rulerSign} das Tempo vor und stellt ${c.rulerTopic} in den Mittelpunkt. Der Mond macht ${c.moonTopic} unübersehbar, während die Sonne ${c.sunTopic} als Grund der Anstrengung beleuchtet. Lass die Themen nicht konkurrieren: Der Mond benennt das lebendige Bedürfnis, die Sonne entscheidet, was Bestand verdient. ${c.retrograde ? "Eine Überarbeitung trägt mehr Weisheit als ein dramatischer Neustart." : "Direkte Bewegung ist möglich, wenn das Ziel klar benannt ist."} ${c.elementPrompt}`,
        `${c.signature.presence}. Der Tag lebt von einem hilfreichen Kontrast. Dein Instinkt zieht zu ${c.moonTopic}, die dauerhafte Einladung betrifft jedoch ${c.sunTopic}; deine eigene Art kann beides verbinden. ${c.ruler} in ${c.rulerSign} zeigt, dass die Brücke durch ${c.rulerTopic} entsteht. ${c.retrograde ? "Werde langsamer, wenn eine alte Vereinbarung zur Prüfung zurückkehrt." : "Bewege dich, sobald die praktischen Bedingungen zur Absicht passen."} Am Abend bedeutet Erfolg, das Wesentliche geschützt zu haben.`,
      ]),
    relationships: (c) =>
      pick(c.variant, [
        `Bring ${c.signature.relating} in deine engsten Gespräche. Der Mond verstärkt ${c.moonTopic}; das erste Gefühl ist Information, aber nicht das ganze Gespräch. Benenne dein Bedürfnis in einem klaren Satz und lass Raum für eine unerwartete Antwort. ${c.ruler} in ${c.rulerSign} unterstützt ${c.retrograde ? "die Klärung eines früheren Austauschs" : "ehrliche, haltbare Absprachen"}.`,
        `Verbindung wächst durch ${c.signature.relating}. Unterscheide bei ${c.moonTopic}, ob du Nähe, Klarheit, Sicherheit oder Raum brauchst. Das richtige Bedürfnis zu benennen verhindert unnötiges Drama. Die Sonne bei ${c.sunTopic} zeigt, welche Beziehung den längeren Weg tragen kann.`,
        `Lass einen Menschen dir durch ${c.signature.relating} begegnen. Andeutungen und heimliche Prüfungen helfen heute nicht. ${c.ruler} in ${c.rulerSign} bringt ${c.rulerTopic} in die Beziehung; praktische Details können mehr sagen als große Erklärungen.`,
        `Die Beziehungsaufgabe besteht darin, die Sensibilität bei ${c.moonTopic} zu achten, ohne den anderen für ihre Regulierung verantwortlich zu machen. Deine magnetische Qualität ist ${c.signature.relating}. Verwandle damit Reaktion in Dialog.`,
      ]),
    business: (c) =>
      pick(c.variant, [
        `Dein geschäftlicher Vorteil liegt in ${c.signature.business}. Setze ihn bei ${c.rulerTopic} ein. ${c.aspectPhrase ? `${c.aspectPhrase}; lies die Spannung als Information über Zeitplan, Umfang oder Verantwortung.` : "Definiere das nächste Ergebnis und schließe es ohne zusätzliche Komplexität ab."} Verknüpfe Besprechungen mit Entscheidungen und halte Wichtiges schriftlich fest.`,
        `Das Geschäft bewegt sich heute durch ${c.rulerTopic}; arbeite mit ${c.signature.business}. Bevor du eine Aufgabe ergänzt, bestimme das Ergebnis, das die Woche wirklich verbessern würde. ${c.aspectPhrase ? `${c.aspectPhrase}; eine konkurrierende Priorität kann einen Fehler zeigen, ohne den Plan zu entwerten.` : "Ein ungestörter Arbeitsblock bringt mehr als ständige Erreichbarkeit."}`,
        `Führe mit ${c.signature.business}. Die Sonne bei ${c.sunTopic} klärt den strategischen Zweck, der Mond bei ${c.moonTopic} zeigt den Bedarf von Team, Kunde oder Ablauf. ${c.retrograde ? "Prüfe Annahmen, bevor du Mittel bindest." : "Entscheide dort, wo die Fakten am klarsten sind."} Mache den Fortschritt messbar.`,
        `Behandle ${c.rulerTopic} als heutigen Arbeitstisch. Dein Herrscher in ${c.rulerSign} belohnt ${c.signature.business}, wo eine vage Absicht Frist, Zuständigkeit oder nächsten Schritt braucht. ${c.aspectPhrase ? `${c.aspectPhrase}; lass den Unterschied ein besseres Design zeigen.` : "Einfache Abstimmung reicht, um Schwung herzustellen."}`,
      ]),
    money: (c) =>
      pick(c.variant, [
        `Nutze ${c.signature.money} als Finanzregel. Der Mond kann Entscheidungen bei ${c.moonTopic} dringend wirken lassen; trenne den emotionalen Kaufgrund vom praktischen Wert. Prüfe Betrag, Verlängerung und Alternativkosten. Die Sonne bei ${c.sunTopic} begünstigt Ausgaben für die längere Richtung.`,
        `Geld verlangt nach Maß statt Entbehrung. Handle mit ${c.signature.money} und prüfe eine wiederkehrende Ausgabe oder geteilte Pflicht rund um ${c.rulerTopic}. ${c.retrograde ? "Rückerstattung, Korrektur oder Neuverhandlung kann klüger sein als eine neue Bindung." : "Ein klares Ja oder Nein ist besser als ein offenes Vielleicht mit Preis."}`,
        `Die nützliche Frage lautet nicht nur „Kann ich es mir leisten?“, sondern „Was stärkt diese Wahl?“. ${c.signature.money} gibt der Antwort Kontur. Die Sonne weist auf ${c.sunTopic}; lass diese Priorität die Verteilung bestimmen. Wenn der Mond Unsicherheit bei ${c.moonTopic} weckt, kehre zu Fakten zurück.`,
        `Bring die Zahlen ans Licht. ${c.signature.money} schützt heutige Bedürfnisse und künftigen Spielraum. Mit ${c.ruler} in ${c.rulerSign} gehören Mittel zu ${c.rulerTopic}, doch Wert muss gezeigt werden. Bestätige Gesamtkosten und Zuständigkeiten.`,
      ]),
    wellbeing: (c) =>
      `Bewahre genug Ruhe, um deinen Rhythmus von der Umgebung zu unterscheiden. Ein kleines Ritual rund um ${c.moonTopic} kann Stabilität bringen.`,
    opportunity: (c) =>
      pick(c.variant, [
        `Arbeite mit ${c.signature.business}. Eine konkrete Bewegung bei ${c.sunTopic} kann eine Richtung setzen, die andere verstehen und mittragen.`,
        `Durch ${c.rulerTopic} öffnet sich eine Tür. Richte deine Aufmerksamkeit auf die nützliche Einladung, die bereits vor dir liegt, und mache deine natürliche Art zum Vorteil.`,
        `Sage Ja zu dem Teil von ${c.sunTopic}, der echte Beteiligung verlangt. Mit ${c.signature.business} trägst du die Idee weiter als durch das Warten auf perfekte Bedingungen.`,
        `Verwandle das heutige Bewusstsein für ${c.moonTopic} in Schwung. Ein rechtzeitiges Gespräch oder eine praktische Geste kann ${c.sunTopic} in greifbare Nähe rücken.`,
      ]),
    caution: (c) =>
      `Behandle eine vorübergehende Stimmung bei ${c.moonTopic} nicht als endgültiges Urteil.`,
    question: (c) =>
      pick(c.variant, [
        `Wo würde ${c.signature.relating} das Muster rund um ${c.moonTopic} verändern?`,
        `Was möchtest du bei ${c.sunTopic} aufbauen, sobald du nicht mehr auf vollständige Gewissheit wartest?`,
        `Welche Wahrheit über ${c.rulerTopic} verdient vor Tagesende eine direkte Antwort?`,
        `Wo bist du eingeladen, mit ${c.signature.business} zu arbeiten, statt eine vertraute Gewohnheit zu wiederholen?`,
      ]),
    phases: (c) => [
      {
        period: "morning",
        theme: c.moonTopic,
        guidance: pick(c.variant, [
          "Prüfe die emotionale Temperatur, bevor du das Tempo setzt.",
          "Beginne mit dem, was inneren Raum schafft.",
          "Benenne das lebendige Bedürfnis und beende eine kleine Handlung.",
          "Beobachte vor der Antwort; der Morgen zeigt dann mehr.",
        ]),
      },
      {
        period: "afternoon",
        theme: c.rulerTopic,
        guidance: pick(c.variant + 1, [
          "Mache aus Einsicht eine Entscheidung, Zuständigkeit oder Frist.",
          "Nutze die Tagesmitte für das Gespräch, das Klarheit braucht.",
          "Konzentriere Kraft dort, wo sie sich summieren kann.",
          "Prüfe den Plan an der Wirklichkeit, passe ihn an und gehe weiter.",
        ]),
      },
      {
        period: "evening",
        theme: c.sunTopic,
        guidance: pick(c.variant + 2, [
          "Entscheide, was morgen fortgesetzt werden soll.",
          "Schließe die wichtigste Schleife vor deinem Urteil.",
          "Wähle Erholung, die dich zu dir zurückführt.",
          "Sammle den Sinn des Tages: Was wurde klarer?",
        ]),
      },
    ],
  },
} satisfies Record<LocaleTag, DailyCopy>;

export function dailyCopy(locale: LocaleTag): DailyCopy {
  return shared[locale];
}

export function localizedAspectPhrase(aspect: Aspect, locale: LocaleTag) {
  const b1 = localizeAstroTerm(aspect.body1, locale);
  const b2 = localizeAstroTerm(aspect.body2, locale);
  const a = localizeAstroTerm(aspect.type, locale).toLowerCase();
  if (locale === "es-ES")
    return `${b1} en ${a} con ${b2} crea un intercambio entre ambos impulsos`;
  if (locale === "fr-FR")
    return `${b1} en ${a} avec ${b2} met leurs deux élans en dialogue`;
  if (locale === "de-DE")
    return `${b1} im ${a} zu ${b2} bringt beide Kräfte ins Gespräch`;
  return `${b1} ${a} ${b2} brings their two drives into dialogue`;
}
