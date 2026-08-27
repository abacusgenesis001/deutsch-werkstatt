import { openai } from "./openai";
import { CURRICULUM } from "./curriculum";
import type {
  ExerciseEvaluation,
  EvaluationStatus,
} from "./evaluation-model";
import type { ErrorCategory } from "./learner-state";

export interface AIEvaluationRequest {
  exerciseId: string;
  level: string;
  englishText: string;
  learnerGerman: string;
}

export interface AIEvaluationResult {
  overallScore: number;
  status: EvaluationStatus;
  parameters: {
    grammar: {
      score: number;
      errorCount: number;
      summary: string;
    };
    vocabulary: {
      score: number;
      errorCount: number;
      summary: string;
    };
    wordOrder: {
      score: number;
      errorCount: number;
      summary: string;
    };
    contextForm: {
      score: number;
      errorCount: number;
      summary: string;
    };
  };
  sentences: Array<{
    sentenceId: string;
    learnerText: string;
    status: EvaluationStatus;
    errors: Array<{
      id: string;
      category: ErrorCategory;
      status: EvaluationStatus;
      learnerText: string;
      correctedText: string;
      explanation: string;
      underlyingConceptIds: string[];
      severity: "minor" | "moderate" | "major";
    }>;
    overallExplanation: string;
  }>;
  underlyingConceptIds: string[];
  reinforcementConceptIds: string[];
}

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: {
      type: "number",
    },
    status: {
      type: "string",
      enum: ["correct", "alternative", "error", "uncertain"],
    },
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        grammar: {
          type: "object",
          additionalProperties: false,
          properties: {
            score: { type: "number" },
            errorCount: { type: "number" },
            summary: { type: "string" },
          },
          required: ["score", "errorCount", "summary"],
        },
        vocabulary: {
          type: "object",
          additionalProperties: false,
          properties: {
            score: { type: "number" },
            errorCount: { type: "number" },
            summary: { type: "string" },
          },
          required: ["score", "errorCount", "summary"],
        },
        wordOrder: {
          type: "object",
          additionalProperties: false,
          properties: {
            score: { type: "number" },
            errorCount: { type: "number" },
            summary: { type: "string" },
          },
          required: ["score", "errorCount", "summary"],
        },
        contextForm: {
          type: "object",
          additionalProperties: false,
          properties: {
            score: { type: "number" },
            errorCount: { type: "number" },
            summary: { type: "string" },
          },
          required: ["score", "errorCount", "summary"],
        },
      },
      required: ["grammar", "vocabulary", "wordOrder", "contextForm"],
    },
    sentences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sentenceId: { type: "string" },
          learnerText: { type: "string" },
          status: {
            type: "string",
            enum: ["correct", "alternative", "error", "uncertain"],
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                category: {
                  type: "string",
                  enum: [
                    "grammar",
                    "vocabulary",
                    "word_order",
                    "context_form",
                  ],
                },
                status: {
                  type: "string",
                  enum: [
                    "correct",
                    "alternative",
                    "error",
                    "uncertain",
                  ],
                },
                learnerText: { type: "string" },
                correctedText: { type: "string" },
                explanation: { type: "string" },
                underlyingConceptIds: {
                  type: "array",
                  items: { type: "string" },
                },
                severity: {
                  type: "string",
                  enum: ["minor", "moderate", "major"],
                },
              },
              required: [
                "id",
                "category",
                "status",
                "learnerText",
                "correctedText",
                "explanation",
                "underlyingConceptIds",
                "severity",
              ],
            },
          },
          overallExplanation: { type: "string" },
        },
        required: [
          "sentenceId",
          "learnerText",
          "status",
          "errors",
          "overallExplanation",
        ],
      },
    },
    underlyingConceptIds: {
      type: "array",
      items: { type: "string" },
    },
    reinforcementConceptIds: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "overallScore",
    "status",
    "parameters",
    "sentences",
    "underlyingConceptIds",
    "reinforcementConceptIds",
  ],
};

const systemPrompt = `
You are the German-language evaluation engine for Deutsch Werkstatt.

The learner is currently an early A1 German learner.

Your job is to evaluate the learner's German accurately, consistently,
and pedagogically.

==================================================
FOUR-PARAMETER CLASSIFICATION SYSTEM
==================================================

Every genuine error MUST be assigned according to its PRIMARY
LINGUISTIC CAUSE.

--------------------------------------------------
1. GRAMMAR
--------------------------------------------------

Classify an error as "grammar" when the learner violates a German
grammatical rule governing structure, agreement, inflection, or
grammatical form.

This includes:

- noun case
- article declension
- pronoun declension
- possessive-pronoun declension
- adjective endings
- grammatical gender agreement
- verb conjugation
- verb tense
- modal-verb constructions
- grammatical negation
- prepositions that govern a particular case
- grammatical agreement
- grammatical forms determined by case, gender, number, person,
  tense, or grammatical construction

A visible word-form error caused by grammar is still GRAMMAR.

Example:

"mit meine Schwester"

→ "mit meiner Schwester"

PRIMARY CATEGORY: grammar

--------------------------------------------------
2. VOCABULARY
--------------------------------------------------

Classify an error as "vocabulary" when the learner selects an
incorrect lexical item, misunderstands a word's meaning, lacks an
appropriate lexical item, or uses a word whose lexical meaning does
not express the intended meaning.

Do not mark a word incorrect merely because another German word could
also be used.

--------------------------------------------------
3. WORD ORDER
--------------------------------------------------

Classify an error as "word_order" when otherwise appropriate words or
forms are arranged incorrectly according to German syntax.

This includes:

- main-clause verb position
- question structure
- subordinate-clause word order
- infinitive placement
- separable-verb placement
- positioning of sentence elements
- other syntactic ordering requirements

If an error involves both morphology and placement, determine the
PRIMARY underlying cause.

--------------------------------------------------
4. CONTEXT / FORM
--------------------------------------------------

Classify an error as "context_form" ONLY when the problem is primarily
caused by contextual appropriateness, register, orthography, nuance,
or situational form rather than a core grammatical rule.

This includes:

- inappropriate formal/informal register
- inappropriate expression for the stated situation
- genuine spelling errors
- contextual wording problems
- inappropriate professional/social register
- grammatically valid wording that is inappropriate for the intended
  situation or meaning

A grammatical inflection error is NOT context_form.

For example:

"meine" → "meiner" because of dative

is GRAMMAR.

==================================================
ROOT-CAUSE DECISION RULE
==================================================

Determine the underlying linguistic cause before assigning a category.

Use this order:

1. Grammar rule violation → grammar
2. Wrong lexical meaning/item → vocabulary
3. Incorrect syntactic arrangement → word_order
4. Context/register/orthographic/situational problem → context_form

Do not force an error into a category when the evidence does not
support it.

==================================================
VALID ALTERNATIVES
==================================================

German permits multiple correct formulations.

"correct" = valid and appropriate.

"alternative" = valid German, but another formulation may be more
natural, conventional, precise, or appropriate.

"error" = genuinely incorrect or meaning-changing.

"uncertain" = insufficient context for a reliable judgment.

Never mark a valid alternative as an error merely because it differs
from a reference formulation.

==================================================
SURFACE ERRORS AND UNDERLYING CONCEPTS
==================================================

A sentence may contain multiple surface errors caused by one
underlying learning concept.

Record meaningful surface errors individually, but do not treat
related manifestations of the same underlying concept as independent
learning weaknesses.

==================================================
EARLY-A1 POLICY
==================================================

The learner is at the beginning of A1.

Therefore:

- Be pedagogically lenient where appropriate.
- Prioritize conceptual understanding.
- Explain significant errors thoroughly.
- Do not penalize minor stylistic differences unnecessarily.
- Accept valid standard-German alternatives.
- Do not demand advanced constructions from an early-A1 learner.
- Prefer standard German suitable for learning and certification.
- Do not penalize the learner merely for not using slang,
  regionalisms, or jargon.

==================================================
SCORING
==================================================

Score every parameter from 0 to 100.

Scores must reflect actual performance.

Do not manufacture errors.

overallScore should represent the overall quality of the submission.

==================================================
CURRICULUM CONCEPT RESTRICTION
==================================================

You are given an authoritative list of curriculum concepts.

You MUST use ONLY concept IDs from that list.

Never invent a concept ID.

This applies to:

- underlyingConceptIds
- reinforcementConceptIds

If an error does not correspond closely enough to an available
curriculum concept, leave its underlyingConceptIds empty.

==================================================
EXPLANATION
==================================================

For every significant error:

1. Identify what the learner wrote.
2. Give the corrected form.
3. Identify the parameter.
4. Identify the underlying concept.
5. Explain WHY the correction is required.
6. Give an example where useful.

The learner is early A1, so explanations should be detailed and
teaching-oriented.

==================================================
CURRENT CURRICULUM
==================================================

{{CURRICULUM_CONCEPTS}}

Return ONLY the requested structured data.
`;

function getCurriculumConcepts(level: string) {
  if (!(level in CURRICULUM)) {
    throw new Error(`Invalid CEFR level: ${level}`);
  }

  const curriculumLevel =
    CURRICULUM[level as keyof typeof CURRICULUM];

  return curriculumLevel.concepts.map((concept) => ({
    id: concept.id,
    name: concept.name,
    type: concept.type,
    domain: concept.domain,
  }));
}

export async function evaluateWithAI(
  request: AIEvaluationRequest,
): Promise<ExerciseEvaluation> {
  const {
    exerciseId,
    level,
    englishText,
    learnerGerman,
  } = request;

  if (!englishText.trim()) {
    throw new Error("English source text is required.");
  }

  if (!learnerGerman.trim()) {
    throw new Error("Learner German response is required.");
  }

  const curriculumConcepts = getCurriculumConcepts(level);

  const resolvedSystemPrompt = systemPrompt.replace(
    "{{CURRICULUM_CONCEPTS}}",
    JSON.stringify(curriculumConcepts, null, 2),
  );

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    store: false,

    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: resolvedSystemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Exercise ID: ${exerciseId}

CEFR level: ${level}

English source:
${englishText}

Learner's German:
${learnerGerman}
            `,
          },
        ],
      },
    ],

    text: {
      format: {
        type: "json_schema",
        name: "deutsch_werkstatt_evaluation",
        strict: true,
        schema: evaluationSchema,
      },
    },
  });

  const output = response.output_text;

  if (!output) {
    throw new Error("OpenAI returned an empty evaluation.");
  }

  const evaluation = JSON.parse(
    output,
  ) as AIEvaluationResult;

  return {
    exerciseId,
    evaluatedAt: new Date().toISOString(),
    overallScore: evaluation.overallScore,
    status: evaluation.status,
    parameters: {
      grammar: {
        category: "grammar",
        ...evaluation.parameters.grammar,
      },
      vocabulary: {
        category: "vocabulary",
        ...evaluation.parameters.vocabulary,
      },
      wordOrder: {
        category: "word_order",
        ...evaluation.parameters.wordOrder,
      },
      contextForm: {
        category: "context_form",
        ...evaluation.parameters.contextForm,
      },
    },
    sentences: evaluation.sentences,
    underlyingConceptIds: evaluation.underlyingConceptIds,
    reinforcementConceptIds:
      evaluation.reinforcementConceptIds,
  };
}