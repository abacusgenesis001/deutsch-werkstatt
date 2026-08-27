import type { Exercise } from "./exercise-model";
import type { ExerciseEvaluation } from "./evaluation-model";
import { evaluateWithAI } from "./ai-evaluator";

export interface EvaluationRequest {
  exercise: Exercise;
  learnerResponses: Record<string, string>;
}

export interface ExerciseEvaluator {
  evaluate(
    request: EvaluationRequest,
  ): Promise<ExerciseEvaluation>;
}

function buildSourceText(exercise: Exercise): string {
  if (exercise.passage?.trim()) {
    return exercise.passage.trim();
  }

  return exercise.sentences
    .map((sentence) => sentence.sourceText.trim())
    .filter(Boolean)
    .join("\n");
}

function buildLearnerGerman(
  exercise: Exercise,
  learnerResponses: Record<string, string>,
): string {
  return exercise.sentences
    .map((sentence) => {
      const response =
        learnerResponses[sentence.id] ?? "";

      if (!response.trim()) {
        return "";
      }

      return response.trim();
    })
    .filter(Boolean)
    .join("\n");
}

export async function evaluateExercise(
  request: EvaluationRequest,
): Promise<ExerciseEvaluation> {
  const { exercise, learnerResponses } = request;

  const englishText = buildSourceText(exercise);
  const learnerGerman = buildLearnerGerman(
    exercise,
    learnerResponses,
  );

  if (!englishText) {
    throw new Error(
      "Exercise does not contain source text for evaluation.",
    );
  }

  if (!learnerGerman) {
    throw new Error(
      "Learner response is empty.",
    );
  }

  return evaluateWithAI({
    exerciseId: exercise.id,
    level: exercise.level,
    englishText,
    learnerGerman,
  });
}