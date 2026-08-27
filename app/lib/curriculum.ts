import type { CEFRLevel } from "./learner-state";

export type CurriculumDomain =
  | "personal_information"
  | "daily_life"
  | "family"
  | "time_and_dates"
  | "food_and_drink"
  | "home"
  | "work_and_study"
  | "shopping"
  | "travel"
  | "health"
  | "communication"
  | "grammar_foundations"
  | "sentence_construction";

export type ConceptType =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "context_form";

export interface CurriculumConcept {
  id: string;
  name: string;
  type: ConceptType;
  domain: CurriculumDomain;
  prerequisiteIds: string[];
}

export interface CurriculumLevel {
  level: CEFRLevel;
  description: string;
  domains: CurriculumDomain[];
  concepts: CurriculumConcept[];
}

export const CURRICULUM: Record<CEFRLevel, CurriculumLevel> = {
  A1: {
    level: "A1",
    description:
      "Foundational German for simple everyday communication and A1-level certification preparation.",

    domains: [
      "personal_information",
      "daily_life",
      "family",
      "time_and_dates",
      "food_and_drink",
      "home",
      "work_and_study",
      "shopping",
      "grammar_foundations",
      "sentence_construction",
    ],

    concepts: [
      {
        id: "a1-greetings-introductions",
        name: "Greetings and basic introductions",
        type: "vocabulary",
        domain: "personal_information",
        prerequisiteIds: [],
      },
      {
        id: "a1-personal-information",
        name: "Giving and asking for personal information",
        type: "vocabulary",
        domain: "personal_information",
        prerequisiteIds: ["a1-greetings-introductions"],
      },
      {
        id: "a1-pronouns",
        name: "Personal pronouns",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: [],
      },
      {
        id: "a1-present-tense",
        name: "Present-tense verb conjugation",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-pronouns"],
      },
      {
        id: "a1-sein",
        name: "Verb sein",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-pronouns"],
      },
      {
        id: "a1-haben",
        name: "Verb haben",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-pronouns"],
      },
      {
        id: "a1-noun-gender",
        name: "Basic noun gender: der, die, das",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: [],
      },
      {
        id: "a1-indefinite-articles",
        name: "Indefinite articles: ein, eine",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-noun-gender"],
      },
      {
        id: "a1-definite-articles",
        name: "Definite articles: der, die, das",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-noun-gender"],
      },
      {
        id: "a1-basic-word-order",
        name: "Basic German main-clause word order",
        type: "word_order",
        domain: "sentence_construction",
        prerequisiteIds: ["a1-present-tense"],
      },
      {
        id: "a1-yes-no-questions",
        name: "Yes/no question structure",
        type: "word_order",
        domain: "sentence_construction",
        prerequisiteIds: ["a1-present-tense"],
      },
      {
        id: "a1-question-words",
        name: "Basic question-word structures",
        type: "word_order",
        domain: "sentence_construction",
        prerequisiteIds: ["a1-present-tense"],
      },
      {
        id: "a1-negation-nicht",
        name: "Basic negation with nicht",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-basic-word-order"],
      },
      {
        id: "a1-negation-kein",
        name: "Basic negation with kein",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-indefinite-articles"],
      },
      {
        id: "a1-numbers",
        name: "Numbers and basic quantities",
        type: "vocabulary",
        domain: "time_and_dates",
        prerequisiteIds: [],
      },
      {
        id: "a1-days-months",
        name: "Days, months, and basic dates",
        type: "vocabulary",
        domain: "time_and_dates",
        prerequisiteIds: ["a1-numbers"],
      },
      {
        id: "a1-time",
        name: "Telling and asking the time",
        type: "vocabulary",
        domain: "time_and_dates",
        prerequisiteIds: ["a1-numbers"],
      },
      {
        id: "a1-family-vocabulary",
        name: "Basic family vocabulary",
        type: "vocabulary",
        domain: "family",
        prerequisiteIds: ["a1-personal-information"],
      },
      {
        id: "a1-daily-routine",
        name: "Basic daily-routine vocabulary",
        type: "vocabulary",
        domain: "daily_life",
        prerequisiteIds: ["a1-present-tense"],
      },
      {
        id: "a1-modal-verbs",
        name: "Basic modal verbs",
        type: "grammar",
        domain: "grammar_foundations",
        prerequisiteIds: ["a1-present-tense", "a1-basic-word-order"],
      },
    ],
  },

  A2: {
    level: "A2",
    description:
      "Elementary German for broader everyday communication and A2-level certification preparation.",
    domains: [],
    concepts: [],
  },

  B1: {
    level: "B1",
    description:
      "Intermediate German for independent everyday, social, educational, and workplace communication.",
    domains: [],
    concepts: [],
  },

  B2: {
    level: "B2",
    description:
      "Upper-intermediate German for more complex communication and independent language use.",
    domains: [],
    concepts: [],
  },

  C1: {
    level: "C1",
    description:
      "Advanced German for complex academic, professional, and social communication.",
    domains: [],
    concepts: [],
  },

  C2: {
    level: "C2",
    description:
      "Near-complete mastery of German across highly complex contexts.",
    domains: [],
    concepts: [],
  },
};