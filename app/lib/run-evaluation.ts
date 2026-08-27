import type { Exercise } from "./exercise-model";
import type { ExerciseEvaluation } from "./evaluation-model";
import { evaluateExercise } from "./evaluate-exercise";

export interface LearnerExerciseResponse {
  sentenceId: string;
  learnerText: string;
}

export async function runExerciseEvaluation(
  exercise: Exercise,
  responses: LearnerExerciseResponse[],
): Promise<ExerciseEvaluation> {
  const learnerResponses: Record<string, string> = {};

  for (const response of responses) {
    learnerResponses[response.sentenceId] = response.learnerText;
  }

  return evaluateExercise({
    exercise,
    learnerResponses,
  });
}