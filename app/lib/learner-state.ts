// Deutsch Werkstatt
// Learner State Foundation
//
// This file defines the shared learning model used by the
// future evaluation, progress, adaptive exercise, and
// reporting systems.
//
// Build #1: Data model only.
// No UI, API, database, or OpenAI integration yet.

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Skill =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

export type ErrorCategory =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "context_form";

export type MasteryState =
  | "active_learning"
  | "stabilization"
  | "maintained"
  | "regressed";

export type ProgressionState =
  | "consolidate"
  | "preview"
  | "advance";

export interface ConceptPerformance {
  conceptId: string;
  conceptName: string;

  masteryScore: number;

  totalAttempts: number;
  correctAttempts: number;
  errorCount: number;

  recentPerformance: number;

  state: MasteryState;

  lastPracticedAt?: string;
  nextReviewAt?: string;
}

export interface VocabularyItem {
  wordId: string;
  word: string;

  meaning?: string;

  article?: "der" | "die" | "das";

  plural?: string;

  forms?: string[];

  masteryScore: number;

  recognitionScore: number;
  productionScore: number;
  contextualUsageScore: number;
  retentionScore: number;

  state: MasteryState;

  introducedAt?: string;
  lastPracticedAt?: string;
  nextReviewAt?: string;
}

export interface ErrorRecord {
  errorId: string;

  exerciseId: string;
  sentenceId?: string;

  learnerText: string;
  correctedText: string;

  category: ErrorCategory;

  explanation: string;

  underlyingConceptIds: string[];

  severity: "minor" | "moderate" | "major";

  occurredAt: string;
}

export interface SkillPerformance {
  skill: Skill;

  score: number;

  totalAttempts: number;
  successfulAttempts: number;

  recentPerformance: number;

  lastPracticedAt?: string;
}

export interface ExerciseRecord {
  exerciseId: string;

  level: CEFRLevel;

  skill: Skill;

  completedAt: string;

  score?: number;

  errorIds: string[];

  conceptIds: string[];

  vocabularyIds: string[];
}

export interface CurriculumProgress {
  level: CEFRLevel;

  overallProgress: number;

  completedConceptIds: string[];

  currentConceptIds: string[];

  progressionState: ProgressionState;
}

export interface LearnerProfile {
  learnerId: string;

  currentLevel: CEFRLevel;

  curriculum: CurriculumProgress;

  concepts: ConceptPerformance[];

  vocabulary: VocabularyItem[];

  errors: ErrorRecord[];

  skills: Record<Skill, SkillPerformance>;

  exerciseHistory: ExerciseRecord[];

  createdAt: string;

  updatedAt: string;
}