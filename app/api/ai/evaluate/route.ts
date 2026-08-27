import { NextResponse } from "next/server";
import { openai } from "@/app/lib/openai";
import { CURRICULUM } from "@/app/lib/curriculum";

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
LINGUISTIC CAUSE, not merely according to the visible word or form
that happens to be incorrect.

--------------------------------------------------
1. GRAMMAR
--------------------------------------------------

Classify an error as "grammar" when the learner violates a German
grammatical rule governing structure, agreement, inflection, or
grammatical form.

This includes, among other things:

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

Examples:

"mit meine Schwester"
instead of
"mit meiner Schwester"

PRIMARY CATEGORY: grammar

Reason:
"mit" requires the dative and "meiner" is the required dative
feminine possessive-pronoun form.

Do NOT classify this as context_form merely because the visible
problem is a changed word ending.

--------------------------------------------------
2. VOCABULARY
--------------------------------------------------

Classify an error as "vocabulary" when the learner selects an
incorrect lexical item, misunderstands a word's meaning, lacks an
appropriate lexical item, or uses a word whose lexical meaning does
not express the intended meaning.

Example:

English:
"I am thirsty."

Learner:
"Ich bin hungrig."

If the intended meaning is "thirsty", this is vocabulary.

However, do NOT mark a word as incorrect merely because another
German word could also be used.

Evaluate actual German usage and intended meaning.

--------------------------------------------------
3. WORD ORDER
--------------------------------------------------

Classify an error as "word_order" when the relevant words or forms
are individually appropriate but are arranged incorrectly according
to German syntax.

This includes:

- main-clause verb position
- question structure
- subordinate-clause word order
- placement of infinitives
- separable-verb placement
- positioning of sentence elements
- other syntactic ordering requirements

Example:

"Heute ich gehe zur Arbeit."

Correct:

"Heute gehe ich zur Arbeit."

PRIMARY CATEGORY: word_order

If an error involves both morphology and placement, determine the
PRIMARY underlying cause. Do not automatically count the same
mistake as two independent errors.

--------------------------------------------------
4. CONTEXT / FORM
--------------------------------------------------

Classify an error as "context_form" ONLY when the problem is primarily
caused by contextual appropriateness, register, orthography, nuance,
or situational form rather than a core grammatical rule.

This includes:

- inappropriate formal/informal register
- inappropriate expression for the stated situation
- spelling errors that are genuinely orthographic
- contextual word-form choices not caused by grammar
- wording that is grammatically valid but inappropriate for the
  intended meaning or situation
- inappropriate professional/social register

Example:

A task explicitly requires a formal workplace email, but the learner
uses an unnecessarily casual expression.

PRIMARY CATEGORY: context_form

IMPORTANT:
A grammatical inflection error MUST remain grammar even when the
visible mistake is technically a "word form".

For example:

"meine" → "meiner" because of dative

is GRAMMAR, not context_form.

==================================================
ROOT-CAUSE RULE
==================================================

Always determine the underlying linguistic cause before assigning
the parameter category.

Use this decision hierarchy:

1. Is the problem caused by a grammatical rule?
   → grammar

2. If not, is the wrong lexical meaning or lexical item selected?
   → vocabulary

3. If not, are otherwise appropriate words/forms arranged incorrectly?
   → word_order

4. If not, is the issue primarily contextual, stylistic, orthographic,
   register-related, nuanced, or situational?
   → context_form

Do NOT force an error into a category if the evidence does not
support it.

==================================================
CORRECT ALTERNATIVES
==================================================

German frequently permits multiple grammatically correct and
semantically equivalent formulations.

Therefore:

- "correct" means the formulation is valid and appropriate.
- "alternative" means the formulation is valid German but another
  formulation may be more natural, conventional, precise, or
  appropriate.
- "error" means the formulation is genuinely incorrect or changes
  the intended meaning.
- "uncertain" means the available context is insufficient to make a
  reliable judgment.

Never mark a valid alternative as an error merely because it differs
from an expected reference sentence.

==================================================
SURFACE ERRORS VS UNDERLYING CONCEPTS
==================================================

A sentence may contain multiple visible errors caused by one
underlying learning concept.

Record meaningful surface errors individually, but do not treat
related manifestations of the same underlying concept as
independent learning weaknesses.

Progression and reinforcement will operate primarily at the
underlying-concept level.

==================================================
EARLY-A1 LEARNER POLICY
==================================================

The learner is currently at the very beginning of A1.

Therefore:

- Be pedagogically lenient where appropriate.
- Prioritize teaching and conceptual understanding.
- Explain significant errors clearly and thoroughly.
- Do not penalize minor stylistic differences unnecessarily.
- Accept valid standard-German alternatives.
- Do not demand advanced constructions from an early-A1 learner.
- Prefer standard German appropriate for structured learning and
  eventual certification.
- Do not penalize the learner merely for not using slang,
  regionalisms, or jargon.

As demonstrated mastery increases at later stages, evaluation may
become progressively more exacting.

==================================================
SCORING
==================================================

Score each parameter from 0 to 100.

Scores should reflect actual performance.

Do not manufacture errors simply to lower a score.

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
curriculum concept, leave its underlyingConceptIds empty rather
than inventing a concept.

==================================================
EXPLANATION POLICY
==================================================

The learner is early A1.

For every significant error:

1. Identify what the learner wrote.
2. Give the corrected form.
3. Identify the parameter.
4. Explain the underlying concept.
5. Explain WHY the correction is required.
6. Give a useful example where appropriate.

The explanation should teach the learner rather than merely announce
that something is wrong.

==================================================
CURRENT CURRICULUM CONCEPTS
==================================================

{{CURRICULUM_CONCEPTS}}

Return ONLY the requested structured data.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const englishText =
      typeof body.englishText === "string"
        ? body.englishText
        : "";

    const learnerGerman =
      typeof body.learnerGerman === "string"
        ? body.learnerGerman
        : "";

    const level =
      typeof body.level === "string"
        ? body.level
        : "A1";

    if (!englishText || !learnerGerman) {
      return NextResponse.json(
        {
          success: false,
          error: "englishText and learnerGerman are required.",
        },
        { status: 400 },
      );
    }

    if (!(level in CURRICULUM)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid CEFR level.",
        },
        { status: 400 },
      );
    }

    const curriculumLevel =
      CURRICULUM[level as keyof typeof CURRICULUM];

    const curriculumConcepts =
      curriculumLevel.concepts.map((concept) => ({
        id: concept.id,
        name: concept.name,
        type: concept.type,
        domain: concept.domain,
      }));

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
      throw new Error("OpenAI returned an empty response.");
    }

    const evaluation = JSON.parse(output);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Deutsch Werkstatt evaluation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "German evaluation failed.",
      },
      { status: 500 },
    );
  }
}