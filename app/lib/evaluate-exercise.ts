import type { Exercise } from "./exercise-model";
import type { ExerciseEvaluation } from "./evaluation-model";

export interface EvaluationRequest {
  exercise: Exercise;
  learnerResponses: Record<string, string>;
}

export interface ExerciseEvaluator {
  evaluate(
    request: EvaluationRequest,
  ): Promise<ExerciseEvaluation>;
}

/**
 * Placeholder evaluator.
 *
 * This does NOT attempt to evaluate German.
 * The real evaluator will be connected later.
 */
export async function evaluateExercise(
  request: EvaluationRequest,
): Promise<ExerciseEvaluation> {
  const { exercise } = request;

  const now = new Date().toISOString();

  return {
    exerciseId: exercise.id,
    evaluatedAt: now,
    overallScore: 0,
    status: "uncertain",

    parameters: {
      grammar: {
        category: "grammar",
        score: 0,
        errorCount: 0,
        summary: "Evaluation not yet connected.",
      },

      vocabulary: {
        category: "vocabulary",
        score: 0,
        errorCount: 0,
        summary: "Evaluation not yet connected.",
      },

      wordOrder: {
        category: "word_order",
        score: 0,
        errorCount: 0,
        summary: "Evaluation not yet connected.",
      },

      contextForm: {
        category: "context_form",
        score: 0,
        errorCount: 0,
        summary: "Evaluation not yet connected.",
      },
    },

    sentences: [],

    underlyingConceptIds: [],

    reinforcementConceptIds: [],
  };
}