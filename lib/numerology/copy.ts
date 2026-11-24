import type { LocaleTag } from "@/lib/i18n/config";

/**
 * Reader-facing numerology copy. English is the Celestial Atlas prototype copy;
 * Spanish, French and German are translations of it. Every locale defines every
 * number, enforced by the types below.
 */
type CycleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type CoreNumber = CycleNumber | 11 | 22 | 33;

export interface NumberMeaning {
  title: string;
  keywords: string;
  core: string;
}

export interface NumerologyCopy {
  personalYear: Record<CycleNumber, string>;
  personalDay: Record<CycleNumber, string>;
  meanings: Record<CoreNumber, NumberMeaning>;
  /** Short reflection for each of the eight principal Moon phases, New Moon first. */
  moonPhaseText: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}

const enGB: NumerologyCopy = {
  personalYear: {
    1: "A starting year. Launch, apply, begin — what you start now sets the tone for the next nine years.",
    2: "A patience year. Relationships and partnerships grow; results come slower. Cooperate.",
    3: "A social, creative year. Say yes to invitations and share your work publicly.",
    4: "A building year. Hard work, budgets, health routines. Foundations laid now pay off later.",
    5: "A change year. Travel, moves, new people. Stay flexible and say yes to the unexpected.",
    6: "A home and responsibility year. Family, commitments, and care take center stage.",
    7: "A reflective year. Study, rest, and rethink. Don't force big outward moves.",
    8: "A power year. Career and money move. Ask for what you're worth.",
    9: "A completion year. Finish, release, clear out. Make room for next year's fresh start.",
  },
  personalDay: {
    1: "Start something. Send the email, make the call, take the first step.",
    2: "Listen more than you talk. Small kindnesses go far.",
    3: "Socialize, create, share. Good day for a creative task.",
    4: "Get organized. Admin, budgets, and chores feel satisfying.",
    5: "Expect the unexpected. Change your routine a little.",
    6: "Focus on home and the people you care about.",
    7: "Slow down. Read, reflect, take a walk alone.",
    8: "Handle money and business. Make the confident ask.",
    9: "Wrap things up. Clear clutter and let go of one thing.",
  },
  meanings: {
    1: {
      title: "The Initiator",
      keywords: "Independence · drive · originality",
      core: "You're built to start things and to do them your own way. Confidence grows every time you act without waiting for permission.",
    },
    2: {
      title: "The Diplomat",
      keywords: "Cooperation · sensitivity · partnership",
      core: "You're the one who makes partnerships work. You notice what others need and quietly bring people together.",
    },
    3: {
      title: "The Communicator",
      keywords: "Expression · creativity · joy",
      core: "You're here to express — through words, art, humor, or style. Your energy lifts people.",
    },
    4: {
      title: "The Builder",
      keywords: "Stability · discipline · reliability",
      core: "You build things that last. Systems, routines, and hard work are how you turn plans into reality.",
    },
    5: {
      title: "The Explorer",
      keywords: "Freedom · change · curiosity",
      core: "You learn by doing and need variety to feel alive. Change doesn't scare you — standing still does.",
    },
    6: {
      title: "The Nurturer",
      keywords: "Responsibility · care · home",
      core: "You take care of people and spaces. Others naturally come to you for support and advice.",
    },
    7: {
      title: "The Seeker",
      keywords: "Analysis · introspection · wisdom",
      core: "You need to understand how things really work. Solitude and study recharge you.",
    },
    8: {
      title: "The Executive",
      keywords: "Ambition · authority · results",
      core: "You're wired for achievement and material success. You understand money, leverage, and authority.",
    },
    9: {
      title: "The Humanitarian",
      keywords: "Compassion · completion · idealism",
      core: "You see the bigger picture and care about leaving things better. You've often lived several lives in one.",
    },
    11: {
      title: "The Intuitive · Master",
      keywords: "Insight · inspiration · sensitivity",
      core: "A master number: heightened intuition and the ability to inspire. You often know things before you can explain them.",
    },
    22: {
      title: "The Master Builder",
      keywords: "Vision · execution · legacy",
      core: "A master number: big vision with the practical ability to make it real. You can build things that outlast you.",
    },
    33: {
      title: "The Master Teacher",
      keywords: "Compassion · service · guidance",
      core: "A master number: rare and service-oriented. You lift others through care, teaching, and example.",
    },
  },
  moonPhaseText: [
    "Set intentions. A quiet start — plan rather than push.",
    "Take the first small steps on what you set in motion.",
    "Decision point. Push through the first obstacle.",
    "Refine and adjust. You're close.",
    "Peak emotion and visibility. Things come to light — celebrate or release.",
    "Share what you've learned. Gratitude and generosity.",
    "Let go of what didn't work. Clear space.",
    "Rest and recharge before the next cycle.",
  ],
};

const esES: NumerologyCopy = {
  personalYear: {
    1: "Un año de comienzos. Lanza, solicita, empieza: lo que inicies ahora marca el tono de los próximos nueve años.",
    2: "Un año de paciencia. Las relaciones y las alianzas crecen; los resultados llegan más despacio. Coopera.",
    3: "Un año social y creativo. Acepta invitaciones y comparte tu trabajo en público.",
    4: "Un año para construir. Trabajo constante, presupuestos, rutinas de salud. Las bases de ahora darán fruto más adelante.",
    5: "Un año de cambios. Viajes, mudanzas, gente nueva. Mantente flexible y di sí a lo inesperado.",
    6: "Un año de hogar y responsabilidad. La familia, los compromisos y el cuidado pasan a primer plano.",
    7: "Un año de reflexión. Estudia, descansa y replantéate las cosas. No fuerces grandes movimientos hacia fuera.",
    8: "Un año de poder. La carrera y el dinero se mueven. Pide lo que vales.",
    9: "Un año de cierre. Termina, suelta, despeja. Haz sitio para el nuevo comienzo del año que viene.",
  },
  personalDay: {
    1: "Empieza algo. Envía el correo, haz la llamada, da el primer paso.",
    2: "Escucha más de lo que hablas. Los pequeños gestos llegan lejos.",
    3: "Socializa, crea, comparte. Buen día para una tarea creativa.",
    4: "Organízate. Los trámites, los presupuestos y las tareas resultan satisfactorios.",
    5: "Espera lo inesperado. Cambia un poco tu rutina.",
    6: "Céntrate en tu hogar y en las personas que te importan.",
    7: "Baja el ritmo. Lee, reflexiona, da un paseo a solas.",
    8: "Ocúpate del dinero y de los negocios. Pide con seguridad.",
    9: "Cierra asuntos. Despeja el desorden y suelta una cosa.",
  },
  meanings: {
    1: {
      title: "El Iniciador",
      keywords: "Independencia · empuje · originalidad",
      core: "Estás hecho para empezar cosas y hacerlas a tu manera. La confianza crece cada vez que actúas sin esperar permiso.",
    },
    2: {
      title: "El Diplomático",
      keywords: "Cooperación · sensibilidad · alianza",
      core: "Eres quien hace que las alianzas funcionen. Percibes lo que otros necesitan y unes a las personas sin hacer ruido.",
    },
    3: {
      title: "El Comunicador",
      keywords: "Expresión · creatividad · alegría",
      core: "Has venido a expresarte: con palabras, arte, humor o estilo. Tu energía levanta a los demás.",
    },
    4: {
      title: "El Constructor",
      keywords: "Estabilidad · disciplina · fiabilidad",
      core: "Construyes cosas que perduran. Los sistemas, las rutinas y el trabajo constante convierten tus planes en realidad.",
    },
    5: {
      title: "El Explorador",
      keywords: "Libertad · cambio · curiosidad",
      core: "Aprendes haciendo y necesitas variedad para sentirte vivo. El cambio no te asusta; quedarte quieto, sí.",
    },
    6: {
      title: "El Protector",
      keywords: "Responsabilidad · cuidado · hogar",
      core: "Cuidas de las personas y de los espacios. Los demás acuden a ti de forma natural en busca de apoyo y consejo.",
    },
    7: {
      title: "El Buscador",
      keywords: "Análisis · introspección · sabiduría",
      core: "Necesitas entender cómo funcionan realmente las cosas. La soledad y el estudio te recargan.",
    },
    8: {
      title: "El Ejecutivo",
      keywords: "Ambición · autoridad · resultados",
      core: "Estás programado para el logro y el éxito material. Entiendes el dinero, el apalancamiento y la autoridad.",
    },
    9: {
      title: "El Humanitario",
      keywords: "Compasión · culminación · idealismo",
      core: "Ves el panorama completo y te importa dejar las cosas mejor. A menudo has vivido varias vidas en una.",
    },
    11: {
      title: "El Intuitivo · Maestro",
      keywords: "Intuición · inspiración · sensibilidad",
      core: "Un número maestro: intuición aguda y capacidad de inspirar. A menudo sabes cosas antes de poder explicarlas.",
    },
    22: {
      title: "El Maestro Constructor",
      keywords: "Visión · ejecución · legado",
      core: "Un número maestro: una gran visión con la capacidad práctica de hacerla realidad. Puedes construir cosas que te sobrevivan.",
    },
    33: {
      title: "El Maestro Guía",
      keywords: "Compasión · servicio · orientación",
      core: "Un número maestro: poco común y orientado al servicio. Elevas a los demás con tu cuidado, tu enseñanza y tu ejemplo.",
    },
  },
  moonPhaseText: [
    "Fija intenciones. Un comienzo tranquilo: planifica en lugar de forzar.",
    "Da los primeros pasos pequeños en lo que pusiste en marcha.",
    "Momento de decidir. Supera el primer obstáculo.",
    "Pule y ajusta. Estás cerca.",
    "Máxima emoción y visibilidad. Las cosas salen a la luz: celebra o suelta.",
    "Comparte lo que has aprendido. Gratitud y generosidad.",
    "Suelta lo que no funcionó. Haz espacio.",
    "Descansa y recarga antes del próximo ciclo.",
  ],
};

const frFR: NumerologyCopy = {
  personalYear: {
    1: "Une année de départ. Lancez, postulez, commencez : ce que vous entreprenez maintenant donne le ton des neuf prochaines années.",
    2: "Une année de patience. Les relations et les partenariats se développent ; les résultats arrivent plus lentement. Coopérez.",
    3: "Une année sociale et créative. Acceptez les invitations et montrez votre travail.",
    4: "Une année de construction. Travail soutenu, budgets, routines de santé. Les bases posées maintenant porteront leurs fruits plus tard.",
    5: "Une année de changement. Voyages, déménagements, nouvelles rencontres. Restez souple et dites oui à l’imprévu.",
    6: "Une année tournée vers le foyer et les responsabilités. La famille, les engagements et le soin passent au premier plan.",
    7: "Une année de réflexion. Étudiez, reposez-vous, repensez. Ne forcez pas de grands mouvements vers l’extérieur.",
    8: "Une année de puissance. La carrière et l’argent bougent. Demandez ce que vous valez.",
    9: "Une année d’achèvement. Terminez, lâchez prise, faites le tri. Faites de la place pour le nouveau départ de l’an prochain.",
  },
  personalDay: {
    1: "Commencez quelque chose. Envoyez l’e-mail, passez l’appel, faites le premier pas.",
    2: "Écoutez plus que vous ne parlez. Les petites attentions vont loin.",
    3: "Sortez, créez, partagez. Une bonne journée pour une tâche créative.",
    4: "Organisez-vous. Les papiers, les budgets et les tâches ménagères sont satisfaisants.",
    5: "Attendez-vous à l’imprévu. Changez un peu votre routine.",
    6: "Concentrez-vous sur votre foyer et sur les personnes qui comptent pour vous.",
    7: "Ralentissez. Lisez, réfléchissez, faites une promenade seul.",
    8: "Occupez-vous de l’argent et des affaires. Formulez votre demande avec assurance.",
    9: "Bouclez ce qui traîne. Désencombrez et lâchez une chose.",
  },
  meanings: {
    1: {
      title: "L’Initiateur",
      keywords: "Indépendance · élan · originalité",
      core: "Vous êtes fait pour lancer des projets et les mener à votre façon. La confiance grandit chaque fois que vous agissez sans attendre de permission.",
    },
    2: {
      title: "Le Diplomate",
      keywords: "Coopération · sensibilité · partenariat",
      core: "C’est vous qui faites fonctionner les partenariats. Vous remarquez ce dont les autres ont besoin et vous rassemblez les gens en douceur.",
    },
    3: {
      title: "Le Communicant",
      keywords: "Expression · créativité · joie",
      core: "Vous êtes là pour vous exprimer : par les mots, l’art, l’humour ou le style. Votre énergie porte les autres.",
    },
    4: {
      title: "Le Bâtisseur",
      keywords: "Stabilité · discipline · fiabilité",
      core: "Vous construisez des choses qui durent. Les systèmes, les routines et le travail soutenu transforment vos projets en réalité.",
    },
    5: {
      title: "L’Explorateur",
      keywords: "Liberté · changement · curiosité",
      core: "Vous apprenez en faisant et avez besoin de variété pour vous sentir vivant. Le changement ne vous effraie pas ; l’immobilité, si.",
    },
    6: {
      title: "Le Protecteur",
      keywords: "Responsabilité · soin · foyer",
      core: "Vous prenez soin des personnes et des lieux. Les autres viennent naturellement chercher votre soutien et vos conseils.",
    },
    7: {
      title: "Le Chercheur",
      keywords: "Analyse · introspection · sagesse",
      core: "Vous avez besoin de comprendre comment les choses fonctionnent vraiment. La solitude et l’étude vous ressourcent.",
    },
    8: {
      title: "Le Dirigeant",
      keywords: "Ambition · autorité · résultats",
      core: "Vous êtes fait pour la réussite et le succès matériel. Vous comprenez l’argent, l’effet de levier et l’autorité.",
    },
    9: {
      title: "L’Humaniste",
      keywords: "Compassion · accomplissement · idéalisme",
      core: "Vous voyez la situation d’ensemble et tenez à laisser les choses en meilleur état. Vous avez souvent vécu plusieurs vies en une.",
    },
    11: {
      title: "L’Intuitif · Maître",
      keywords: "Intuition · inspiration · sensibilité",
      core: "Un nombre maître : une intuition aiguisée et la capacité d’inspirer. Vous savez souvent les choses avant de pouvoir les expliquer.",
    },
    22: {
      title: "Le Maître Bâtisseur",
      keywords: "Vision · réalisation · héritage",
      core: "Un nombre maître : une grande vision et la capacité pratique de la concrétiser. Vous pouvez bâtir des choses qui vous survivront.",
    },
    33: {
      title: "Le Maître Enseignant",
      keywords: "Compassion · service · transmission",
      core: "Un nombre maître : rare et tourné vers le service. Vous élevez les autres par votre soin, votre enseignement et votre exemple.",
    },
  },
  moonPhaseText: [
    "Posez vos intentions. Un départ calme : planifiez plutôt que de forcer.",
    "Faites les premiers petits pas vers ce que vous avez lancé.",
    "Moment de décision. Franchissez le premier obstacle.",
    "Affinez et ajustez. Vous y êtes presque.",
    "Émotions et visibilité à leur comble. Les choses se révèlent : célébrez ou lâchez prise.",
    "Partagez ce que vous avez appris. Gratitude et générosité.",
    "Laissez aller ce qui n’a pas fonctionné. Faites de la place.",
    "Reposez-vous et rechargez-vous avant le prochain cycle.",
  ],
};

const deDE: NumerologyCopy = {
  personalYear: {
    1: "Ein Jahr des Anfangs. Starte, bewirb dich, beginne – was du jetzt anstößt, gibt den Ton für die nächsten neun Jahre vor.",
    2: "Ein Jahr der Geduld. Beziehungen und Partnerschaften wachsen; Ergebnisse kommen langsamer. Arbeite mit anderen zusammen.",
    3: "Ein geselliges, kreatives Jahr. Nimm Einladungen an und zeige deine Arbeit.",
    4: "Ein Jahr des Aufbaus. Fleiß, Budgets, Gesundheitsroutinen. Was du jetzt legst, zahlt sich später aus.",
    5: "Ein Jahr der Veränderung. Reisen, Umzüge, neue Menschen. Bleib flexibel und sag Ja zum Unerwarteten.",
    6: "Ein Jahr für Zuhause und Verantwortung. Familie, Verpflichtungen und Fürsorge stehen im Mittelpunkt.",
    7: "Ein Jahr der Besinnung. Lerne, ruhe dich aus, denke neu. Erzwinge keine großen Schritte nach außen.",
    8: "Ein Jahr der Stärke. Karriere und Geld kommen in Bewegung. Fordere, was du wert bist.",
    9: "Ein Jahr des Abschlusses. Beende, lass los, räume auf. Schaffe Platz für den Neuanfang im nächsten Jahr.",
  },
  personalDay: {
    1: "Fang etwas an. Schick die E-Mail, ruf an, mach den ersten Schritt.",
    2: "Hör mehr zu, als du redest. Kleine Freundlichkeiten wirken weit.",
    3: "Triff Menschen, sei kreativ, teile. Ein guter Tag für eine kreative Aufgabe.",
    4: "Bring Ordnung hinein. Papierkram, Budgets und Erledigungen fühlen sich gut an.",
    5: "Rechne mit dem Unerwarteten. Ändere deine Routine ein wenig.",
    6: "Konzentriere dich auf dein Zuhause und die Menschen, die dir wichtig sind.",
    7: "Mach langsamer. Lies, denk nach, geh allein spazieren.",
    8: "Kümmere dich um Geld und Geschäftliches. Stell deine Forderung selbstbewusst.",
    9: "Schließ Dinge ab. Räum auf und lass eine Sache los.",
  },
  meanings: {
    1: {
      title: "Der Initiator",
      keywords: "Unabhängigkeit · Antrieb · Originalität",
      core: "Du bist dafür gemacht, Dinge anzustoßen und sie auf deine Art umzusetzen. Dein Selbstvertrauen wächst jedes Mal, wenn du handelst, ohne auf Erlaubnis zu warten.",
    },
    2: {
      title: "Der Diplomat",
      keywords: "Zusammenarbeit · Feingefühl · Partnerschaft",
      core: "Du bist es, der Partnerschaften gelingen lässt. Du merkst, was andere brauchen, und bringst Menschen leise zusammen.",
    },
    3: {
      title: "Der Kommunikator",
      keywords: "Ausdruck · Kreativität · Freude",
      core: "Du bist hier, um dich auszudrücken – mit Worten, Kunst, Humor oder Stil. Deine Energie hebt andere an.",
    },
    4: {
      title: "Der Baumeister",
      keywords: "Stabilität · Disziplin · Verlässlichkeit",
      core: "Du baust Dinge, die bleiben. Systeme, Routinen und Fleiß machen deine Pläne wirklich.",
    },
    5: {
      title: "Der Entdecker",
      keywords: "Freiheit · Wandel · Neugier",
      core: "Du lernst durch Tun und brauchst Abwechslung, um dich lebendig zu fühlen. Veränderung macht dir keine Angst – Stillstand schon.",
    },
    6: {
      title: "Der Fürsorgliche",
      keywords: "Verantwortung · Fürsorge · Zuhause",
      core: "Du kümmerst dich um Menschen und Orte. Andere kommen ganz selbstverständlich zu dir, wenn sie Halt und Rat suchen.",
    },
    7: {
      title: "Der Suchende",
      keywords: "Analyse · Innenschau · Weisheit",
      core: "Du musst verstehen, wie die Dinge wirklich funktionieren. Alleinsein und Lernen geben dir Kraft.",
    },
    8: {
      title: "Der Macher",
      keywords: "Ehrgeiz · Autorität · Ergebnisse",
      core: "Du bist auf Erfolg und materielle Leistung ausgerichtet. Du verstehst Geld, Hebelwirkung und Autorität.",
    },
    9: {
      title: "Der Menschenfreund",
      keywords: "Mitgefühl · Vollendung · Idealismus",
      core: "Du siehst das große Ganze und willst die Dinge besser hinterlassen. Oft hast du schon mehrere Leben in einem gelebt.",
    },
    11: {
      title: "Der Intuitive · Meisterzahl",
      keywords: "Einsicht · Inspiration · Feingefühl",
      core: "Eine Meisterzahl: geschärfte Intuition und die Gabe, andere zu inspirieren. Oft weißt du Dinge, bevor du sie erklären kannst.",
    },
    22: {
      title: "Der Meisterbaumeister",
      keywords: "Vision · Umsetzung · Vermächtnis",
      core: "Eine Meisterzahl: große Vision mit der praktischen Fähigkeit, sie umzusetzen. Du kannst Dinge bauen, die dich überdauern.",
    },
    33: {
      title: "Der Meisterlehrer",
      keywords: "Mitgefühl · Dienst · Begleitung",
      core: "Eine Meisterzahl: selten und auf das Dienen ausgerichtet. Du stärkst andere durch Fürsorge, Lehre und Vorbild.",
    },
  },
  moonPhaseText: [
    "Setze Absichten. Ein ruhiger Beginn – plane, statt zu drängen.",
    "Geh die ersten kleinen Schritte bei dem, was du angestoßen hast.",
    "Zeit für Entscheidungen. Überwinde das erste Hindernis.",
    "Verfeinere und passe an. Du bist nah dran.",
    "Gefühle und Sichtbarkeit auf dem Höhepunkt. Dinge kommen ans Licht – feiere oder lass los.",
    "Teile, was du gelernt hast. Dankbarkeit und Großzügigkeit.",
    "Lass los, was nicht funktioniert hat. Schaffe Raum.",
    "Ruhe dich aus und tanke auf vor dem nächsten Zyklus.",
  ],
};

export const numerologyCopy: Record<LocaleTag, NumerologyCopy> = {
  "en-GB": enGB,
  "es-ES": esES,
  "fr-FR": frFR,
  "de-DE": deDE,
};

export function cycleText(
  table: Record<CycleNumber, string>,
  value: number,
): string {
  return table[value as CycleNumber] ?? "";
}

export function numberMeaning(
  copy: NumerologyCopy,
  value: number,
): NumberMeaning | undefined {
  return copy.meanings[value as CoreNumber];
}
