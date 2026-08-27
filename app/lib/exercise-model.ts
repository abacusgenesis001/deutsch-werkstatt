import type { CEFRLevel, Skill } from "./learner-state";

export type ExerciseType =
  | "translation"
  | "reading_comprehension"
  | "read_aloud"
  | "listen_repeat"
  | "speaking_response";

export interface ExerciseSentence {
  id: string;

  sourceText: string;

  targetText?: string;

  conceptIds: string[];

  vocabularyIds: string[];
}

export interface Exercise {
  id: string;

  level: CEFRLevel;

  skill: Skill;

  type: ExerciseType;

  title: string;

  instructions: string;

  passage?: string;

  sentences: ExerciseSentence[];

  targetConceptIds: string[];

  targetVocabularyIds: string[];

  difficulty: {
    vocabulary: number;
    passageLength: number;
    grammar: number;
    wordOrder: number;
    context: number;
    cognitiveLoad: number;
  };

  isLevelPractice: boolean;
}

export interface ExerciseSet {
  id: string;

  level: CEFRLevel;

  exercises: Exercise[];

  createdAt: string;
}