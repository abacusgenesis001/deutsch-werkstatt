import type { ErrorCategory } from "./learner-state";

export type EvaluationStatus =
  | "correct"
  | "alternative"
  | "error"
  | "uncertain";

export type ErrorSeverity = "minor" | "moderate" | "major";

export interface SurfaceError {
  id: string;

  category: ErrorCategory;

  status: EvaluationStatus;

  learnerText: string;

  correctedText?: string;

  explanation: string;

  underlyingConceptIds: string[];

  severity?: ErrorSeverity;
}

export interface SentenceEvaluation {
  sentenceId: string;

  learnerText: string;

  status: EvaluationStatus;

  errors: SurfaceError[];

  overallExplanation?: string;
}

export interface ParameterEvaluation {
  category: ErrorCategory;

  score: number;

  errorCount: number;

  summary: string;
}

export interface ExerciseEvaluation {
  exerciseId: string;

  evaluatedAt: string;

  overallScore: number;

  status: EvaluationStatus;

  parameters: {
    grammar: ParameterEvaluation;
    vocabulary: ParameterEvaluation;
    wordOrder: ParameterEvaluation;
    contextForm: ParameterEvaluation;
  };

  sentences: SentenceEvaluation[];

  underlyingConceptIds: string[];

  reinforcementConceptIds: string[];
}