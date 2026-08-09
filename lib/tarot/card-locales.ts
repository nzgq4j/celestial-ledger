import { TAROT_CARDS } from "@/lib/tarot/cards";
import type { TarotCard, TarotLocale, TarotSuit } from "@/lib/tarot/types";

type LocalizedCardCopy = Pick<TarotCard, "name" | "upright" | "reversed">;

const ES_MAJOR: Record<string, LocalizedCardCopy> = {
  "major-0": {
    name: "El Loco",
    upright:
      "Los comienzos y la espontaneidad invitan a dar un paso meditado hacia lo desconocido, dejando espacio para aprender.",
    reversed:
      "Observa si el impulso o la vacilación marcan el ritmo; define una protección y un primer paso manejable.",
  },
  "major-1": {
    name: "El Mago",
    upright:
      "El ingenio y la constancia pueden dar forma a una idea; reconoce las herramientas que ya tienes a mano.",
    reversed:
      "La habilidad puede estar dispersa o carecer de propósito; revisa tu intención y aplica una herramienta con honestidad.",
  },
  "major-2": {
    name: "La Sacerdotisa",
    upright:
      "Deja espacio para lo que sabes en silencio; no todo necesita una respuesta o un anuncio inmediato.",
    reversed:
      "El ruido o hablar antes de tiempo puede desplazar la reflexión; separa la intuición de las suposiciones.",
  },
  "major-3": {
    name: "La Emperatriz",
    upright:
      "La creatividad y el cuidado atento pueden ayudar a crecer algo valioso; observa qué necesita constancia.",
    reversed:
      "Dar demasiado o descuidar tus necesidades puede agotar la creatividad; incluye el descanso en el proceso.",
  },
  "major-4": {
    name: "El Emperador",
    upright:
      "La estructura, la disciplina y los límites claros pueden ofrecer una base estable para tu siguiente paso.",
    reversed:
      "Una norma o límite puede haberse vuelto rígido; pregunta si todavía cumple su propósito original.",
  },
  "major-5": {
    name: "El Hierofante",
    upright:
      "La tradición, una persona mentora de confianza o una práctica establecida puede ofrecer un marco útil.",
    reversed:
      "Cuestiona las convenciones con cuidado; quizá debas adaptar los consejos heredados a tu situación.",
  },
  "major-6": {
    name: "Los Enamorados",
    upright:
      "Una elección significativa te pide alinear tus acciones con una relación, un valor o un camino importante.",
    reversed:
      "La indecisión o los valores en tensión pueden crear fricción; aclara qué significa la coherencia para ti.",
  },
  "major-7": {
    name: "El Carro",
    upright:
      "El esfuerzo enfocado puede encauzar demandas opuestas; elige dónde colocar tu energía.",
    reversed:
      "El esfuerzo disperso o la presión por avanzar puede ocultar la ruta; detente y redefine el destino.",
  },
  "major-8": {
    name: "La Fuerza",
    upright:
      "El valor paciente y la confianza serena pueden ser más útiles que la fuerza.",
    reversed:
      "La duda o el sobreesfuerzo pueden reducir tus opciones; prueba una respuesta más amable y sostenible.",
  },
  "major-9": {
    name: "El Ermitaño",
    upright:
      "Tomar distancia de forma deliberada puede dejar espacio para tu propia respuesta meditada.",
    reversed:
      "La soledad puede haberse convertido en desconexión; considera qué perspectiva segura y fiable podría ayudar.",
  },
  "major-10": {
    name: "La Rueda de la Fortuna",
    upright:
      "Un ciclo puede estar cambiando; distingue lo que cambia de aquello sobre lo que aún puedes influir.",
    reversed:
      "Un ciclo conocido puede sentirse estancado; identifica una respuesta que puedas cambiar sin pretender controlarlo todo.",
  },
  "major-11": {
    name: "La Justicia",
    upright:
      "La equidad y la responsabilidad invitan a mirar con claridad las elecciones, sus efectos y la información disponible.",
    reversed:
      "Un desequilibrio puede necesitar una revisión más honesta; comprueba qué responsabilidad o contexto falta.",
  },
  "major-12": {
    name: "El Colgado",
    upright:
      "Una pausa deliberada puede mostrar lo que la urgencia ocultaba; afloja una suposición fija.",
    reversed:
      "La espera puede haberse convertido en evasión; nombra la decisión más pequeña que devolvería movimiento.",
  },
  "major-13": {
    name: "La Muerte",
    upright:
      "Simbólicamente, un final o una transición invita a hacer espacio para otra forma de avanzar.",
    reversed:
      "Aferrarte a una forma anterior puede prolongar la incertidumbre; considera qué soltar de forma segura y gradual.",
  },
  "major-14": {
    name: "La Templanza",
    upright:
      "La paciencia y la moderación pueden combinar necesidades opuestas en algo viable.",
    reversed:
      "El exceso o la impaciencia pueden alterar el equilibrio; reduce el ritmo y ajusta un elemento cada vez.",
  },
  "major-15": {
    name: "El Diablo",
    upright:
      "Mira con honestidad un hábito, miedo o apego restrictivo, recordando que esta reflexión no es un diagnóstico y que conservas tu capacidad de elegir.",
    reversed:
      "Un patrón restrictivo puede estar aflojándose; identifica los apoyos y límites que facilitan elegir de otro modo.",
  },
  "major-16": {
    name: "La Torre",
    upright:
      "Una creencia o estructura puede necesitar una revisión honesta; la alteración puede mostrar dónde cuidar la base.",
    reversed:
      "El miedo a la alteración puede sostener algo inestable; explora el cambio con pasos medidos y apoyo.",
  },
  "major-17": {
    name: "La Estrella",
    upright:
      "La esperanza y la renovación invitan a reconocer una fuente de estabilidad después de un tramo difícil.",
    reversed:
      "El desánimo puede ocultar la esperanza; busca una señal modesta de apoyo o posibilidad.",
  },
  "major-18": {
    name: "La Luna",
    upright:
      "La imagen puede no estar completa; combina intuición y evidencias y deja espacio para revisar tu opinión.",
    reversed:
      "La confusión puede estar disminuyendo, pero conviene comprobar las suposiciones antes de actuar.",
  },
  "major-19": {
    name: "El Sol",
    upright:
      "La claridad y la confianza invitan a reconocer lo que funciona y compartir calidez sin prometer de más.",
    reversed:
      "La alegría o el reconocimiento pueden sentirse apagados; reconoce el progreso sin forzar el optimismo.",
  },
  "major-20": {
    name: "El Juicio",
    upright:
      "Una revisión honesta del pasado puede aclarar qué quieres conservar y qué deseas cambiar.",
    reversed:
      "La duda o la evasión pueden bloquear la reflexión; revisa con equidad, no con castigo.",
  },
  "major-21": {
    name: "El Mundo",
    upright:
      "Un capítulo puede estar listo para integrarse; reconoce lo aprendido antes de elegir el siguiente horizonte.",
    reversed:
      "Los detalles pendientes pueden pedir atención; define qué significa estar suficientemente completo antes de seguir.",
  },
};

const FR_MAJOR: Record<string, LocalizedCardCopy> = {
  "major-0": {
    name: "Le Mat",
    upright:
      "Les commencements et la spontanéité invitent à faire un pas réfléchi vers l’inconnu, en gardant la possibilité d’apprendre.",
    reversed:
      "Observez si l’impulsion ou l’hésitation donne le rythme ; nommez une protection et un premier pas accessible.",
  },
  "major-1": {
    name: "Le Bateleur",
    upright:
      "L’ingéniosité et la constance peuvent donner forme à une idée ; faites l’inventaire des outils déjà disponibles.",
    reversed:
      "Le talent peut être dispersé ou manquer de but ; vérifiez votre intention et employez un outil avec intégrité.",
  },
  "major-2": {
    name: "La Papesse",
    upright:
      "Laissez une place au savoir silencieux sous le bruit ; tout n’exige pas une réponse ou une annonce immédiate.",
    reversed:
      "Le bruit ou une parole prématurée peut étouffer la réflexion ; distinguez intuition et supposition.",
  },
  "major-3": {
    name: "L’Impératrice",
    upright:
      "La créativité et un soin attentif peuvent faire grandir quelque chose de précieux ; voyez ce qui demande de la constance.",
    reversed:
      "Trop donner ou négliger vos besoins peut épuiser la créativité ; intégrez la restauration au travail.",
  },
  "major-4": {
    name: "L’Empereur",
    upright:
      "La structure, la discipline et des limites claires peuvent créer une base stable pour votre prochain geste.",
    reversed:
      "Une règle ou une limite a peut-être durci ; demandez-vous si elle sert encore son intention première.",
  },
  "major-5": {
    name: "Le Pape",
    upright:
      "La tradition, un mentor de confiance ou une pratique établie peut offrir un cadre de réflexion utile.",
    reversed:
      "Interrogez les conventions avec soin ; un conseil hérité peut demander une adaptation à votre situation.",
  },
  "major-6": {
    name: "L’Amoureux",
    upright:
      "Un choix important vous invite à aligner vos actes sur une relation, une valeur ou une voie qui compte.",
    reversed:
      "L’indécision ou des valeurs concurrentes peuvent créer des tensions ; clarifiez ce que l’alignement signifie pour vous.",
  },
  "major-7": {
    name: "Le Chariot",
    upright:
      "Un effort ciblé peut orienter des demandes contraires ; choisissez où placer votre énergie.",
    reversed:
      "Un effort dispersé ou la pression d’avancer peut masquer la route ; faites une pause et redéfinissez la destination.",
  },
  "major-8": {
    name: "La Force",
    upright:
      "Le courage patient et la confiance calme peuvent être plus utiles que la contrainte.",
    reversed:
      "Le doute ou l’effort excessif peut réduire vos options ; essayez une réponse plus douce et durable.",
  },
  "major-9": {
    name: "L’Ermite",
    upright:
      "Un retrait délibéré peut laisser la place à votre propre réponse réfléchie.",
    reversed:
      "La solitude a peut-être glissé vers la déconnexion ; envisagez un point de vue sûr et digne de confiance.",
  },
  "major-10": {
    name: "La Roue de Fortune",
    upright:
      "Un cycle peut évoluer ; distinguez ce qui change de ce qui reste à portée de votre influence.",
    reversed:
      "Un cycle familier peut sembler bloqué ; identifiez une réponse modifiable sans prétendre tout contrôler.",
  },
  "major-11": {
    name: "La Justice",
    upright:
      "L’équité et la responsabilité invitent à examiner clairement les choix, leurs effets et les informations disponibles.",
    reversed:
      "Un déséquilibre peut demander un examen plus honnête ; vérifiez quelle responsabilité ou quel contexte manque.",
  },
  "major-12": {
    name: "Le Pendu",
    upright:
      "Une pause délibérée peut révéler ce que l’urgence cachait ; relâchez une supposition trop fixe.",
    reversed:
      "L’attente est peut-être devenue évitement ; nommez la plus petite décision qui rendrait du mouvement.",
  },
  "major-13": {
    name: "L’Arcane sans nom",
    upright:
      "Symboliquement, une fin ou une transition invite à faire de la place à une autre manière d’avancer.",
    reversed:
      "S’accrocher à une ancienne forme peut prolonger l’incertitude ; voyez ce qui peut être relâché progressivement et sans danger.",
  },
  "major-14": {
    name: "Tempérance",
    upright:
      "La patience et la modération peuvent unir des besoins opposés dans une solution praticable.",
    reversed:
      "L’excès ou l’impatience peut troubler l’équilibre ; ralentissez et ajustez un élément à la fois.",
  },
  "major-15": {
    name: "Le Diable",
    upright:
      "Regardez honnêtement une habitude, une peur ou un attachement restrictif, en vous rappelant que cette réflexion n’est pas un diagnostic et que vous gardez votre capacité d’agir.",
    reversed:
      "Un schéma restrictif peut se desserrer ; identifiez les soutiens et limites qui vous aident à choisir autrement.",
  },
  "major-16": {
    name: "La Maison Dieu",
    upright:
      "Une croyance ou une structure peut demander un examen honnête ; la perturbation peut révéler où la base mérite du soin.",
    reversed:
      "La peur de la perturbation peut maintenir un arrangement instable ; explorez le changement par étapes mesurées et soutenues.",
  },
  "major-17": {
    name: "L’Étoile",
    upright:
      "L’espoir et le renouveau invitent à reconnaître une source de stabilité après une période difficile.",
    reversed:
      "Le découragement peut rendre l’espoir moins perceptible ; cherchez un signe modeste de soutien ou de possibilité.",
  },
  "major-18": {
    name: "La Lune",
    upright:
      "L’image n’est peut-être pas complète ; tenez ensemble intuition et preuves, et gardez la possibilité de réviser votre avis.",
    reversed:
      "La confusion peut s’atténuer, mais les suppositions méritent encore d’être vérifiées avant d’agir.",
  },
  "major-19": {
    name: "Le Soleil",
    upright:
      "La clarté et la confiance invitent à reconnaître ce qui fonctionne et à partager de la chaleur sans promettre trop.",
    reversed:
      "La joie ou la reconnaissance peut sembler atténuée ; reconnaissez le progrès sans forcer l’optimisme.",
  },
  "major-20": {
    name: "Le Jugement",
    upright:
      "Un examen honnête du passé peut éclairer ce que vous voulez garder et ce que vous souhaitez changer.",
    reversed:
      "Le doute ou l’évitement peut bloquer la réflexion ; abordez l’examen avec équité plutôt qu’avec punition.",
  },
  "major-21": {
    name: "Le Monde",
    upright:
      "Un chapitre peut être prêt à être intégré ; mesurez ce que vous avez appris avant de choisir le prochain horizon.",
    reversed:
      "Des détails inachevés peuvent demander votre attention ; définissez ce qui est suffisamment achevé avant d’avancer.",
  },
};

const DE_MAJOR: Record<string, LocalizedCardCopy> = {
  "major-0": {
    name: "Der Narr",
    upright:
      "Anfang und Spontaneität laden zu einem bedachten Schritt ins Unbekannte ein—mit Raum, unterwegs zu lernen.",
    reversed:
      "Beobachte, ob Impuls oder Zögern das Tempo vorgibt; benenne eine Absicherung und einen machbaren ersten Schritt.",
  },
  "major-1": {
    name: "Der Magier",
    upright:
      "Einfallsreichtum und Konsequenz können einer Idee Form geben; erfasse die Werkzeuge, die schon verfügbar sind.",
    reversed:
      "Fähigkeiten können zerstreut oder ohne klares Ziel eingesetzt sein; prüfe deine Absicht und setze ein Werkzeug integer ein.",
  },
  "major-2": {
    name: "Die Hohepriesterin",
    upright:
      "Gib dem stillen Wissen unter dem Lärm Raum; nicht alles braucht sofort eine Antwort oder Bekanntgabe.",
    reversed:
      "Lärm oder vorschnelles Mitteilen kann Reflexion verdrängen; trenne Intuition von Annahmen.",
  },
  "major-3": {
    name: "Die Herrscherin",
    upright:
      "Kreativität und aufmerksame Fürsorge können etwas Wertvolles wachsen lassen; beachte, was stetige Pflege braucht.",
    reversed:
      "Zu viel Geben oder das Vernachlässigen eigener Bedürfnisse kann Kreativität erschöpfen; plane Erholung mit ein.",
  },
  "major-4": {
    name: "Der Herrscher",
    upright:
      "Struktur, Disziplin und klare Grenzen können eine stabile Basis für den nächsten Schritt schaffen.",
    reversed:
      "Eine Regel oder Grenze könnte starr geworden sein; frage, ob sie ihrem ursprünglichen Zweck noch dient.",
  },
  "major-5": {
    name: "Der Hierophant",
    upright:
      "Tradition, eine vertrauenswürdige Begleitung oder eine bewährte Praxis kann einen nützlichen Rahmen bieten.",
    reversed:
      "Hinterfrage Konventionen sorgfältig; übernommener Rat muss vielleicht an deine Lage angepasst werden.",
  },
  "major-6": {
    name: "Die Liebenden",
    upright:
      "Eine bedeutsame Wahl lädt dich ein, Handeln mit einer wichtigen Beziehung, einem Wert oder Weg auszurichten.",
    reversed:
      "Unentschlossenheit oder konkurrierende Werte können Reibung erzeugen; kläre, was Ausrichtung für dich bedeutet.",
  },
  "major-7": {
    name: "Der Wagen",
    upright:
      "Gebündelte Anstrengung kann widersprüchliche Anforderungen in eine Richtung führen; wähle deinen Energieeinsatz.",
    reversed:
      "Zerstreute Mühe oder Fortschrittsdruck kann den Weg verdecken; halte inne und bestimme das Ziel neu.",
  },
  "major-8": {
    name: "Die Kraft",
    upright:
      "Geduldiger Mut und ruhiges Vertrauen können hier hilfreicher sein als Druck.",
    reversed:
      "Selbstzweifel oder Überanstrengung können deine Möglichkeiten verengen; versuche eine sanftere, tragfähige Antwort.",
  },
  "major-9": {
    name: "Der Eremit",
    upright:
      "Ein bewusstes Zurücktreten kann Raum für deine eigene bedachte Antwort schaffen.",
    reversed:
      "Alleinsein könnte in Abgeschnittenheit gekippt sein; erwäge eine sichere, vertrauenswürdige Perspektive.",
  },
  "major-10": {
    name: "Rad des Schicksals",
    upright:
      "Ein Zyklus könnte sich verändern; unterscheide den Wandel von dem, was weiterhin in deinem Einfluss liegt.",
    reversed:
      "Ein vertrauter Zyklus kann festgefahren wirken; finde eine veränderbare Reaktion, ohne alles kontrollieren zu wollen.",
  },
  "major-11": {
    name: "Gerechtigkeit",
    upright:
      "Fairness und Verantwortung laden zu einem klaren Blick auf Entscheidungen, Wirkungen und verfügbare Informationen ein.",
    reversed:
      "Ein Ungleichgewicht kann eine ehrlichere Prüfung brauchen; achte auf übersehene Verantwortung oder Zusammenhänge.",
  },
  "major-12": {
    name: "Der Gehängte",
    upright:
      "Eine bewusste Pause kann zeigen, was Eile verborgen hat; lockere eine feste Annahme.",
    reversed:
      "Warten könnte zu Vermeidung geworden sein; benenne die kleinste Entscheidung, die Bewegung zurückbringt.",
  },
  "major-13": {
    name: "Der Tod",
    upright:
      "Symbolisch lädt ein Ende oder Übergang dazu ein, Raum für einen anderen Weg nach vorn zu schaffen.",
    reversed:
      "Das Festhalten an einer alten Form kann Unsicherheit verlängern; prüfe, was sicher und schrittweise losgelassen werden kann.",
  },
  "major-14": {
    name: "Mäßigkeit",
    upright:
      "Geduld und Maß können gegensätzliche Bedürfnisse zu etwas Praktikablem verbinden.",
    reversed:
      "Übermaß oder Ungeduld kann das Gleichgewicht verzerren; verlangsame und passe jeweils einen Bestandteil an.",
  },
  "major-15": {
    name: "Der Teufel",
    upright:
      "Betrachte ehrlich eine einengende Gewohnheit, Angst oder Bindung und erinnere dich: Diese Reflexion ist keine Diagnose und du behältst Handlungsspielraum.",
    reversed:
      "Ein einengendes Muster könnte sich lockern; benenne Unterstützung und Grenzen, die andere Entscheidungen erleichtern.",
  },
  "major-16": {
    name: "Der Turm",
    upright:
      "Eine Überzeugung oder Struktur könnte ehrliche Prüfung brauchen; Erschütterung kann zeigen, wo das Fundament Pflege verdient.",
    reversed:
      "Angst vor Veränderung kann eine instabile Ordnung halten; erkunde Wandel in gemessenen, unterstützten Schritten.",
  },
  "major-17": {
    name: "Der Stern",
    upright:
      "Hoffnung und Erneuerung laden ein, nach einer schwierigen Strecke eine Quelle der Beständigkeit wahrzunehmen.",
    reversed:
      "Entmutigung kann Hoffnung schwerer spürbar machen; suche ein bescheidenes Zeichen von Unterstützung oder Möglichkeit.",
  },
  "major-18": {
    name: "Der Mond",
    upright:
      "Das Bild ist vielleicht noch unvollständig; halte Intuition neben Belegen und bleibe bereit, deine Sicht zu ändern.",
    reversed:
      "Verwirrung könnte nachlassen, doch Annahmen verdienen weiterhin Prüfung, bevor du handelst.",
  },
  "major-19": {
    name: "Die Sonne",
    upright:
      "Klarheit und Vertrauen laden ein, das Funktionierende anzuerkennen und Wärme ohne Überversprechen zu teilen.",
    reversed:
      "Freude oder Anerkennung kann gedämpft wirken; würdige vorhandenen Fortschritt, ohne Optimismus zu erzwingen.",
  },
  "major-20": {
    name: "Das Gericht",
    upright:
      "Eine ehrliche Rückschau kann klären, was du mitnehmen und was du verändern möchtest.",
    reversed:
      "Selbstzweifel oder Vermeidung kann Reflexion blockieren; begegne der Rückschau fair statt strafend.",
  },
  "major-21": {
    name: "Die Welt",
    upright:
      "Ein Kapitel könnte zur Integration bereit sein; würdige das Gelernte, bevor du den nächsten Horizont wählst.",
    reversed:
      "Offene Details können Aufmerksamkeit verlangen; definiere, was ausreichend abgeschlossen bedeutet, bevor du weitergehst.",
  },
};

type MinorLocale = {
  nameFor: (rank: string, suit: string) => string;
  suitNames: Record<TarotSuit, string>;
  domains: Record<TarotSuit, string>;
  rankNames: readonly string[];
  upright: readonly ((domain: string) => string)[];
  reversed: readonly ((domain: string) => string)[];
};

const ES_MINOR: MinorLocale = {
  nameFor: (rank, suit) => `${rank} de ${suit}`,
  suitNames: {
    wands: "Bastos",
    cups: "Copas",
    swords: "Espadas",
    pentacles: "Oros",
  },
  domains: {
    wands: "el trabajo y los proyectos que te apasionan",
    cups: "el amor y la conexión",
    swords: "los pensamientos y la comunicación",
    pentacles: "el dinero, la salud y los asuntos prácticos",
  },
  rankNames: [
    "As",
    "Dos",
    "Tres",
    "Cuatro",
    "Cinco",
    "Seis",
    "Siete",
    "Ocho",
    "Nueve",
    "Diez",
    "Sota",
    "Caballero",
    "Reina",
    "Rey",
  ],
  upright: [
    (d) => `Una chispa nueva invita a un comienzo manejable en ${d}.`,
    (d) => `Una elección o colaboración pide atención en ${d}.`,
    (d) => `La colaboración puede favorecer un crecimiento inicial en ${d}.`,
    (d) => `Haz una pausa para consolidar lo que has construido en ${d}.`,
    (d) =>
      `La fricción puede ser una señal útil en ${d}; identifica el asunto bajo la tensión.`,
    (d) => `La cooperación puede ayudar a recuperar el equilibrio en ${d}.`,
    (d) => `Evalúa tu estrategia en ${d} antes de invertir más energía.`,
    (d) => `Hay impulso disponible cuando el enfoque está claro en ${d}.`,
    (d) =>
      `La resiliencia importa al acercarte a un umbral significativo en ${d}.`,
    (d) => `Revisa qué puede estar terminando o cambiando de forma en ${d}.`,
    (d) =>
      `La curiosidad y las ganas de aprender pueden renovar tu enfoque de ${d}.`,
    (d) =>
      `La iniciativa puede dar energía a ${d}, siempre que el ritmo no supere al criterio.`,
    (d) => `Una gestión atenta e intuitiva puede sostener ${d}.`,
    (d) => `Una gestión segura y responsable puede orientar ${d}.`,
  ],
  reversed: [
    (d) =>
      `La demora o la duda puede bloquear un comienzo en ${d}; reduce el primer paso hasta hacerlo viable.`,
    (d) =>
      `La indecisión o el desequilibrio puede formarse en ${d}; aclara tu parte antes de suponer la ajena.`,
    (d) =>
      `Un contratiempo puede frenar ${d}; revisa el proceso antes de juzgar el resultado.`,
    (d) =>
      `La estabilidad puede haberse vuelto rutina en ${d}; prueba un cambio acotado.`,
    (d) =>
      `El conflicto puede estar cediendo o evitándose en ${d}; decide qué conversación te corresponde.`,
    (d) =>
      `Un patrón antiguo o intercambio desigual puede requerir revisión en ${d}; explicita las expectativas.`,
    (d) =>
      `El agobio puede indicar que hay que replantear ${d}; reduce el campo.`,
    (d) =>
      `La demora o el esfuerzo disperso puede afectar ${d}; elimina un obstáculo evitable.`,
    (d) =>
      `El agotamiento o la cautela puede influir en ${d}; protege el descanso antes de otro esfuerzo.`,
    (d) =>
      `Una carga puede pesar o estar lista para repartirse en ${d}; decide qué te corresponde llevar.`,
    (d) =>
      `La inexperiencia o la información incierta exige comprobar de nuevo ${d}.`,
    (d) =>
      `La impaciencia o el esfuerzo detenido puede marcar ${d}; reajusta el ritmo.`,
    (d) =>
      `La inseguridad o el exceso de entrega puede agotar ${d}; vuelve a tus propios límites.`,
    (d) =>
      `El control o la inflexibilidad puede limitar ${d}; incorpora proporción y responsabilidad.`,
  ],
};

const FR_MINOR: MinorLocale = {
  nameFor: (rank, suit) => `${rank} de ${suit}`,
  suitNames: {
    wands: "Bâtons",
    cups: "Coupes",
    swords: "Épées",
    pentacles: "Deniers",
  },
  domains: {
    wands: "le travail et les projets qui vous passionnent",
    cups: "l’amour et les liens",
    swords: "la pensée et la communication",
    pentacles: "l’argent, la santé et les questions pratiques",
  },
  rankNames: [
    "As",
    "Deux",
    "Trois",
    "Quatre",
    "Cinq",
    "Six",
    "Sept",
    "Huit",
    "Neuf",
    "Dix",
    "Valet",
    "Cavalier",
    "Reine",
    "Roi",
  ],
  upright: [
    (d) =>
      `Une étincelle nouvelle invite à un commencement accessible dans ${d}.`,
    (d) => `Un choix ou un partenariat demande de l’attention autour de ${d}.`,
    (d) =>
      `La collaboration peut soutenir les premiers développements dans ${d}.`,
    (d) =>
      `Faites une pause pour consolider ce que vous avez construit dans ${d}.`,
    (d) =>
      `La friction peut être un signal utile dans ${d} ; identifiez l’enjeu sous la tension.`,
    (d) => `La coopération peut aider à rétablir l’équilibre dans ${d}.`,
    (d) =>
      `Évaluez votre stratégie dans ${d} avant d’y consacrer plus d’énergie.`,
    (d) => `Un élan est disponible lorsque l’attention est claire dans ${d}.`,
    (d) => `La résilience compte à l’approche d’un seuil important dans ${d}.`,
    (d) => `Examinez ce qui peut s’achever ou changer de forme dans ${d}.`,
    (d) =>
      `La curiosité et le désir d’apprendre peuvent renouveler votre approche de ${d}.`,
    (d) =>
      `L’audace peut dynamiser ${d}, si le rythme ne dépasse pas le discernement.`,
    (d) => `Une attention intuitive et responsable peut soutenir ${d}.`,
    (d) => `Une direction confiante et responsable peut orienter ${d}.`,
  ],
  reversed: [
    (d) =>
      `Le retard ou le doute peut bloquer un début dans ${d} ; réduisez le premier pas jusqu’à ce qu’il soit praticable.`,
    (d) =>
      `L’indécision ou le déséquilibre peut se former dans ${d} ; clarifiez votre part avant de supposer celle d’autrui.`,
    (d) =>
      `Un contretemps peut ralentir ${d} ; examinez le processus avant de juger le résultat.`,
    (d) =>
      `La stabilité peut être devenue une routine dans ${d} ; testez un changement limité.`,
    (d) =>
      `Le conflit peut s’apaiser ou être évité dans ${d} ; choisissez la conversation qui vous revient.`,
    (d) =>
      `Un ancien schéma ou un échange inégal peut demander un examen dans ${d} ; rendez les attentes explicites.`,
    (d) =>
      `Le débordement peut signaler qu’il faut repenser ${d} ; réduisez le champ.`,
    (d) =>
      `Le retard ou la dispersion peut affecter ${d} ; retirez un obstacle évitable.`,
    (d) =>
      `La fatigue ou la prudence peut façonner ${d} ; protégez le repos avant un nouvel effort.`,
    (d) =>
      `Une charge peut peser ou être prête à être répartie dans ${d} ; décidez de ce qui vous revient vraiment.`,
    (d) =>
      `L’inexpérience ou une information incertaine demande une seconde vérification dans ${d}.`,
    (d) =>
      `L’impatience ou un effort bloqué peut façonner ${d} ; réglez le rythme avant d’insister.`,
    (d) =>
      `L’insécurité ou le surinvestissement peut épuiser ${d} ; revenez à vos limites.`,
    (d) =>
      `Le contrôle ou la rigidité peut rétrécir ${d} ; réintroduisez mesure et responsabilité.`,
  ],
};

const DE_MINOR: MinorLocale = {
  nameFor: (rank, suit) => `${rank} der ${suit}`,
  suitNames: {
    wands: "Stäbe",
    cups: "Kelche",
    swords: "Schwerter",
    pentacles: "Münzen",
  },
  domains: {
    wands: "Arbeit und Herzensprojekte",
    cups: "Liebe und Verbindung",
    swords: "Gedanken und Kommunikation",
    pentacles: "Geld, Gesundheit und praktische Angelegenheiten",
  },
  rankNames: [
    "Ass",
    "Zwei",
    "Drei",
    "Vier",
    "Fünf",
    "Sechs",
    "Sieben",
    "Acht",
    "Neun",
    "Zehn",
    "Bube",
    "Ritter",
    "Königin",
    "König",
  ],
  upright: [
    (d) => `Ein neuer Funke lädt zu einem überschaubaren Beginn in ${d} ein.`,
    (d) => `Eine Wahl oder Partnerschaft braucht Aufmerksamkeit rund um ${d}.`,
    (d) => `Zusammenarbeit kann frühes Wachstum in ${d} unterstützen.`,
    (d) => `Halte inne, um das in ${d} Aufgebaute zu festigen.`,
    (d) =>
      `Reibung kann ein nützliches Signal in ${d} sein; benenne das Thema unter der Spannung.`,
    (d) =>
      `Zusammenarbeit kann helfen, Gleichgewicht in ${d} wiederherzustellen.`,
    (d) => `Prüfe deine Strategie in ${d}, bevor du mehr Energie einsetzt.`,
    (d) => `Schwung ist möglich, wenn der Fokus in ${d} klar ist.`,
    (d) => `Widerstandskraft zählt an einer wichtigen Schwelle in ${d}.`,
    (d) => `Prüfe, was in ${d} enden oder seine Form ändern könnte.`,
    (d) =>
      `Neugier und Lernbereitschaft können deinen Umgang mit ${d} erneuern.`,
    (d) =>
      `Mutiges Handeln kann ${d} beleben, solange das Tempo das Urteil nicht überholt.`,
    (d) => `Aufmerksame, intuitive Verantwortung kann ${d} unterstützen.`,
    (d) => `Sichere, verantwortliche Führung kann ${d} Richtung geben.`,
  ],
  reversed: [
    (d) =>
      `Verzögerung oder Zweifel kann einen Anfang in ${d} blockieren; verkleinere den ersten Schritt.`,
    (d) =>
      `Unentschlossenheit oder Ungleichgewicht kann in ${d} entstehen; kläre deinen Anteil, bevor du andere deutest.`,
    (d) =>
      `Ein Rückschlag kann ${d} bremsen; prüfe den Prozess, bevor du das Ergebnis bewertest.`,
    (d) =>
      `Stabilität kann in ${d} zur Routine geworden sein; teste eine begrenzte Veränderung.`,
    (d) =>
      `Konflikt kann nachlassen oder in ${d} vermieden werden; entscheide, welches Gespräch deines ist.`,
    (d) =>
      `Ein altes Muster oder einseitiger Austausch kann in ${d} Prüfung brauchen; mache Erwartungen klar.`,
    (d) =>
      `Überforderung kann zeigen, dass ${d} neu gedacht werden muss; verenge das Feld.`,
    (d) =>
      `Verzögerung oder zerstreute Mühe kann ${d} beeinflussen; entferne ein vermeidbares Hindernis.`,
    (d) =>
      `Erschöpfung oder Vorsicht kann ${d} prägen; schütze Erholungszeit vor einem weiteren Schub.`,
    (d) =>
      `Eine Last kann in ${d} schwer sein oder verteilt werden; entscheide, was wirklich deins ist.`,
    (d) =>
      `Unerfahrenheit oder unsichere Information verlangt eine zweite Prüfung bei ${d}.`,
    (d) =>
      `Ungeduld oder stockende Mühe kann ${d} prägen; justiere das Tempo neu.`,
    (d) =>
      `Unsicherheit oder Überdehnung kann ${d} erschöpfen; kehre zu deinen Grenzen zurück.`,
    (d) =>
      `Kontrolle oder Unbeweglichkeit kann ${d} verengen; lade Maß und Verantwortung ein.`,
  ],
};

const MAJOR_BY_LOCALE = {
  "es-ES": ES_MAJOR,
  "fr-FR": FR_MAJOR,
  "de-DE": DE_MAJOR,
} as const;

const MINOR_BY_LOCALE = {
  "es-ES": ES_MINOR,
  "fr-FR": FR_MINOR,
  "de-DE": DE_MINOR,
} as const;

function localizeMinorCard(
  card: TarotCard & { suit: TarotSuit; number: number },
  locale: Exclude<TarotLocale, "en-GB">,
): TarotCard {
  const copy = MINOR_BY_LOCALE[locale];
  const index = card.number - 1;
  const domain = copy.domains[card.suit];
  return {
    ...card,
    name: copy.nameFor(copy.rankNames[index], copy.suitNames[card.suit]),
    upright: copy.upright[index](domain),
    reversed: copy.reversed[index](domain),
  };
}

export function tarotCardsForLocale(locale: TarotLocale): readonly TarotCard[] {
  if (locale === "en-GB") return TAROT_CARDS;

  return TAROT_CARDS.map((card) => {
    if (card.arcana === "major") {
      const translation = MAJOR_BY_LOCALE[locale][card.id];
      if (!translation) {
        throw new Error(`Missing ${locale} tarot translation for ${card.id}.`);
      }
      return { ...card, ...translation };
    }
    if (!card.suit || !card.number) {
      throw new Error(`Minor tarot card ${card.id} is missing suit or rank.`);
    }
    return localizeMinorCard(
      card as TarotCard & { suit: TarotSuit; number: number },
      locale,
    );
  });
}
