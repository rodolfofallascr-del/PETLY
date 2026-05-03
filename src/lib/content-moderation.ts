import type { ModerationStatus } from "@prisma/client";

export type ModerationCategory = "PET_SALE" | "DRUGS" | "SCAM" | "OFF_TOPIC";

type Rule = {
  category: ModerationCategory;
  reason: string;
  terms: string[];
  weight: number;
};

export type ContentModerationResult = {
  status: ModerationStatus;
  score: number;
  categories: ModerationCategory[];
  matchedTerms: string[];
  primaryReason: string;
};

const rules: Rule[] = [
  {
    category: "PET_SALE",
    reason: "Posible venta de mascotas",
    terms: [
      "vendo cachorro",
      "vendo cachorros",
      "vendo perro",
      "vendo gato",
      "cachorros en venta",
      "perros en venta",
      "gatos en venta",
      "precio por cachorro",
      "se vende mascota",
      "compro cachorro",
      "compro perro",
      "compro gato",
    ],
    weight: 70,
  },
  {
    category: "DRUGS",
    reason: "Contenido relacionado con drogas",
    terms: [
      "cocaina",
      "cocaína",
      "marihuana",
      "weed",
      "cripy",
      "crack",
      "lsd",
      "extasis",
      "éxtasis",
      "tussi",
      "pastillas",
      "vendo droga",
      "delivery de droga",
    ],
    weight: 85,
  },
  {
    category: "SCAM",
    reason: "Posible estafa o captacion sospechosa",
    terms: [
      "dinero facil",
      "dinero fácil",
      "gana dinero rapido",
      "gana dinero rápido",
      "inversion garantizada",
      "inversión garantizada",
      "duplico tu dinero",
      "prestamo sin requisitos",
      "préstamo sin requisitos",
    ],
    weight: 55,
  },
  {
    category: "OFF_TOPIC",
    reason: "Contenido fuera del tema de mascotas",
    terms: [
      "casino online",
      "apuestas deportivas",
      "contenido adulto",
      "armas",
      "municiones",
      "rifle",
      "pistola",
    ],
    weight: 50,
  },
];

const petContextTerms = [
  "mascota",
  "mascotas",
  "perro",
  "perros",
  "gato",
  "gatos",
  "cachorro",
  "cachorros",
  "adopcion",
  "adopción",
  "veterinaria",
  "pet",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function analyzeContentModeration(content: string): ContentModerationResult {
  const normalized = normalizeText(content);
  const matchedRules = rules.filter((rule) =>
    rule.terms.some((term) => normalized.includes(normalizeText(term))),
  );

  const matchedTerms = matchedRules.flatMap((rule) =>
    rule.terms.filter((term) => normalized.includes(normalizeText(term))),
  );
  const categories = unique(matchedRules.map((rule) => rule.category));
  const score = Math.min(
    100,
    matchedRules.reduce((total, rule) => total + rule.weight, 0),
  );
  const primaryRule = matchedRules.sort((a, b) => b.weight - a.weight)[0];
  const hasPetContext = petContextTerms.some((term) => normalized.includes(normalizeText(term)));

  if (!primaryRule) {
    return {
      status: "APPROVED",
      score: hasPetContext ? 5 : 15,
      categories: hasPetContext ? [] : ["OFF_TOPIC"],
      matchedTerms: [],
      primaryReason: hasPetContext ? "Contenido normal de mascotas" : "Sin contexto claro de mascotas",
    };
  }

  return {
    status: score >= 60 ? "FLAGGED" : "PENDING",
    score,
    categories,
    matchedTerms: unique(matchedTerms),
    primaryReason: primaryRule.reason,
  };
}

export function formatModerationDetails(result: ContentModerationResult) {
  const categories = result.categories.length ? result.categories.join(", ") : "Sin categoria critica";
  const terms = result.matchedTerms.length ? result.matchedTerms.join(", ") : "Sin terminos exactos";

  return `Puntaje: ${result.score}/100. Categorias: ${categories}. Coincidencias: ${terms}.`;
}
