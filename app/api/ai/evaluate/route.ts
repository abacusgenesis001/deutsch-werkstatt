import { NextResponse } from "next/server";
import { openai } from "@/app/lib/openai";

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

Your job is to evaluate a German learner's answer accurately and pedagogically.

The learner is currently an early A1 German learner.

For this evaluation:

1. Evaluate the answer across exactly four parameters:
   - Grammar
   - Vocabulary
   - Sentence Construction / Word Order
   - Context/Form

2. Distinguish surface-level errors from underlying learning concepts.

3. Do not treat every visible error as an independent conceptual weakness.

4. Accept grammatically correct alternative formulations.

5. Do not mark a sentence wrong merely because it differs from the reference formulation.

6. If a formulation is valid but less natural, classify it as "alternative", not "error".

7. If context makes the answer genuinely uncertain, use "uncertain" rather than inventing an error.

8. Because the learner is early A1, be teaching-oriented and explain the reason for every significant error clearly.

9. Prioritize standard German appropriate for CEFR learning and eventual certification.

10. Do not penalize the learner for not using slang, regionalisms, or jargon when standard German is appropriate.

11. Identify the underlying German concept responsible for each meaningful error.

12. Provide detailed explanations suitable for an early-A1 learner.

13. Score each parameter from 0 to 100.

14. overallScore should represent the quality of the learner's submission, not simply whether it exactly matches a reference answer.

15. reinforcementConceptIds should contain concepts that deserve targeted reinforcement after this submission.

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

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      store: false,

      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: systemPrompt,
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