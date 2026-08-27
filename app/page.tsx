"use client";

import { useState } from "react";

type Level = "A1" | "A2" | "B1" | "B2";
type Mode = "write" | "translate";

type EvaluationStatus =
  | "correct"
  | "alternative"
  | "error"
  | "uncertain";

type ErrorCategory =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "context_form";

type SurfaceError = {
  id: string;
  category: ErrorCategory;
  status: EvaluationStatus;
  learnerText: string;
  correctedText?: string;
  explanation: string;
  underlyingConceptIds: string[];
  severity?: "minor" | "moderate" | "major";
};

type SentenceEvaluation = {
  sentenceId: string;
  learnerText: string;
  status: EvaluationStatus;
  errors: SurfaceError[];
  overallExplanation?: string;
};

type ParameterEvaluation = {
  category: ErrorCategory;
  score: number;
  errorCount: number;
  summary: string;
};

type ExerciseEvaluation = {
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
};

const passages: Record<Level, string> = {
  A1: `My name is David. I live in Berlin with my sister.

I work in an office from Monday to Friday.

I usually get up at seven o'clock.

In the evening, I learn German and sometimes watch a film.

On weekends, I like to meet my friends or go for a walk in the park.`,

  A2: `Last Saturday I went to the city centre with my sister.

We wanted to buy a birthday present for our mother.

Because the shops were very busy, we had to wait for a long time.

Afterwards, we sat in a café and talked about our plans for the summer.

In the evening, we went home because we were tired.`,

  B1: `Although I was tired after work, I decided to meet a friend in the city.

We had not seen each other for several weeks, so we had a lot to talk about.

While we were walking through the city centre, we discussed our plans for the coming months.

I told him that I wanted to improve my German because I would like to work in Germany one day.

By the time I got home, it was already quite late.`,

  B2: `If I had known how much time learning German would require, I would have started much earlier.

Nevertheless, I have realised that consistent practice is more important than trying to learn everything at once.

Whenever I make a mistake, I try to understand why it occurred instead of simply memorising the correction.

The fact that I can now express complex ideas more clearly motivates me to continue.

In the long term, I would like to reach a level at which I can discuss professional topics without having to translate in my head.`,
};

const specialCharacters = [
  "ä",
  "ö",
  "ü",
  "Ä",
  "Ö",
  "Ü",
  "ß",
  "€",
  "„",
  "“",
  "–",
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("write");
  const [level, setLevel] = useState<Level>("A1");
  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] =
    useState<ExerciseEvaluation | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const insertCharacter = (character: string) => {
    const textarea = document.getElementById(
      "german-answer",
    ) as HTMLTextAreaElement | null;

    if (!textarea) {
      setAnswer((current) => current + character);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const updated =
      answer.slice(0, start) +
      character +
      answer.slice(end);

    setAnswer(updated);

    requestAnimationFrame(() => {
      textarea.focus();

      const cursorPosition =
        start + character.length;

      textarea.setSelectionRange(
        cursorPosition,
        cursorPosition,
      );
    });
  };

  const clearAnswer = () => {
    setAnswer("");
    setEvaluation(null);
    setEvaluationError("");
  };

  const handleLevelChange = (item: Level) => {
    setLevel(item);
    setAnswer("");
    setEvaluation(null);
    setEvaluationError("");
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setAnswer("");
    setEvaluation(null);
    setEvaluationError("");
  };

  const handleCheck = async () => {
    if (!answer.trim()) {
      setEvaluationError(
        "Please write your German answer before checking it.",
      );
      return;
    }

    setIsChecking(true);
    setEvaluationError("");
    setEvaluation(null);

    try {
      const response = await fetch(
        "/api/ai/evaluate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exerciseId: `a1-writing-${level.toLowerCase()}`,
            level,
            englishText: passages[level],
            learnerGerman: answer,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "The evaluation could not be completed.",
        );
      }

      setEvaluation(data.evaluation);
    } catch (error) {
      console.error(error);

      setEvaluationError(
        error instanceof Error
          ? error.message
          : "Something went wrong while evaluating your answer.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).length
    : 0;

  const characterCount = answer.length;

  const parameterItems = evaluation
    ? [
        {
          label: "Grammar",
          value: evaluation.parameters.grammar,
        },
        {
          label: "Vocabulary",
          value: evaluation.parameters.vocabulary,
        },
        {
          label: "Word Order",
          value: evaluation.parameters.wordOrder,
        },
        {
          label: "Context / Form",
          value: evaluation.parameters.contextForm,
        },
      ]
    : [];

  return (
    <main className="app-shell">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-book">📖</div>

          <div>
            <div className="brand-title">
              Deutsch Werkstatt
            </div>

            <div className="brand-subtitle">
              Adaptive German Tutor
            </div>
          </div>
        </div>

        <nav className="top-navigation">
          <button
            className={
              mode === "write"
                ? "top-nav-button active"
                : "top-nav-button"
            }
            onClick={() => handleModeChange("write")}
          >
            Write &amp; Evaluate
          </button>

          <button
            className={
              mode === "translate"
                ? "top-nav-button active"
                : "top-nav-button"
            }
            onClick={() => handleModeChange("translate")}
          >
            Translate
          </button>

          <button className="top-nav-button">
            Progress
          </button>

          <button className="top-nav-button">
            Vocabulary
          </button>
        </nav>

        <div className="top-right">
          <div className="streak">
            🔥 <strong>7 Day Streak</strong>
          </div>

          <button className="top-icon">
            ♧
          </button>

          <button className="top-icon">
            ⚙
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="workspace">
        {/* LEFT SIDEBAR */}
        <aside className="panel left-panel">
          <section className="sidebar-section">
            <div className="section-heading">
              1. MODE
            </div>

            <button
              className={
                mode === "write"
                  ? "sidebar-button selected"
                  : "sidebar-button"
              }
              onClick={() => handleModeChange("write")}
            >
              ✎ &nbsp; Write &amp; Evaluate
            </button>

            <button
              className={
                mode === "translate"
                  ? "sidebar-button selected"
                  : "sidebar-button"
              }
              onClick={() =>
                handleModeChange("translate")
              }
            >
              文 &nbsp; Translate
            </button>
          </section>

          <section className="sidebar-section">
            <div className="section-heading">
              2. LEVEL
            </div>

            <div className="level-grid">
              {(["A1", "A2", "B1", "B2"] as Level[]).map(
                (item) => (
                  <button
                    key={item}
                    className={
                      level === item
                        ? "level-button selected"
                        : "level-button"
                    }
                    onClick={() =>
                      handleLevelChange(item)
                    }
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="sidebar-section">
            <div className="section-heading">
              3. EXERCISE
            </div>

            <button
              className="large-blue-button"
              onClick={() => {
                setAnswer("");
                setEvaluation(null);
                setEvaluationError("");
              }}
            >
              ⟳ &nbsp; New Exercise
            </button>

            <button
              className="large-white-button"
              onClick={() => {
                setEvaluation(null);
                setEvaluationError("");
              }}
            >
              Change Level
            </button>
          </section>

          <section className="sidebar-section">
            <div className="section-heading">
              GERMAN CHARACTERS
            </div>

            <div className="character-help">
              Click a character to insert at cursor
            </div>

            <div className="sidebar-characters">
              {["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map(
                (character) => (
                  <button
                    key={character}
                    className="sidebar-character"
                    onClick={() =>
                      insertCharacter(character)
                    }
                  >
                    {character}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="sidebar-section tools-section">
            <div className="section-heading">
              OTHER TOOLS
            </div>

            <button className="tool-button">
              ▢ &nbsp; Vocabulary List
            </button>

            <button className="tool-button">
              🎓 &nbsp; Grammar Help
            </button>
          </section>
        </aside>

        {/* CENTRE */}
        <section className="panel centre-panel">
          {/* ENGLISH PASSAGE */}
          <div className="passage-header">
            <div className="blue-heading">
              {mode === "write"
                ? "ENGLISH PASSAGE — TYPE THE GERMAN TRANSLATION"
                : "ENGLISH PASSAGE"}
            </div>

            <button className="sound-button">
              🔊
            </button>
          </div>

          <div className="passage-box">
            <div className="passage-text">
              {passages[level]}
            </div>
          </div>

          <div className="divider" />

          {/* GERMAN TYPING AREA */}
          <div className="typing-header">
            <div className="blue-heading">
              TYPE YOUR GERMAN TRANSLATION BELOW
            </div>

            <div className="typing-actions">
              <button className="sound-button">
                🔊
              </button>

              <button className="fullscreen-button">
                ⛶ &nbsp; Full Screen
              </button>
            </div>
          </div>

          <textarea
            id="german-answer"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);

              if (evaluation) {
                setEvaluation(null);
              }

              if (evaluationError) {
                setEvaluationError("");
              }
            }}
            className="typing-area"
            placeholder="Beginne hier zu schreiben..."
            spellCheck={false}
          />

          {/* CONTROLS */}
          <div className="typing-controls">
            <div className="control-top">
              <div className="statistics">
                <span>
                  Words: <strong>{wordCount}</strong>
                </span>

                <span>
                  Characters:{" "}
                  <strong>{characterCount}</strong>
                </span>
              </div>

              <div className="control-buttons">
                <button
                  className="clear-button"
                  onClick={clearAnswer}
                  disabled={isChecking}
                >
                  🗑 &nbsp; Clear
                </button>

                <button
                  className="check-button"
                  onClick={handleCheck}
                  disabled={
                    isChecking || !answer.trim()
                  }
                >
                  {isChecking
                    ? "⏳  Checking..."
                    : "✓  Check"}
                </button>
              </div>
            </div>

            {evaluationError && (
              <div className="control-divider" />
            )}

            {evaluationError && (
              <div className="feedback-card">
                <div className="feedback-message">
                  {evaluationError}
                </div>
              </div>
            )}

            <div className="control-divider" />

            <div className="special-row">
              <div className="special-title">
                Special Characters
              </div>

              <div className="special-buttons">
                {specialCharacters.map((character) => (
                  <button
                    key={character}
                    className="special-character"
                    onClick={() =>
                      insertCharacter(character)
                    }
                  >
                    {character}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT ANALYSIS */}
        <aside className="panel right-panel">
          <div className="analysis-title">
            COMPLETE ANALYSIS
          </div>

          <div className="analysis-content">
            {/* SCORE */}
            <div className="score-card">
              <div className="score-label">
                Overall Score
              </div>

              <div className="score-layout">
                <div className="score-circle">
                  <span>
                    {evaluation
                      ? Math.round(
                          evaluation.overallScore,
                        )
                      : "—"}
                  </span>
                </div>

                <div>
                  <div className="score-status">
                    {evaluation
                      ? evaluation.status === "correct"
                        ? "Excellent!"
                        : evaluation.status ===
                            "alternative"
                          ? "Good!"
                          : evaluation.status ===
                              "uncertain"
                            ? "Needs review"
                            : "Needs correction"
                      : isChecking
                        ? "Checking..."
                        : "Ready!"}
                  </div>

                  <div className="score-description">
                    {evaluation
                      ? "Your submission has been evaluated across all four parameters."
                      : isChecking
                        ? "The tutor is analysing your German."
                        : "Complete the exercise to receive your evaluation."}
                  </div>
                </div>
              </div>
            </div>

            {/* FOUR PARAMETERS */}
            {evaluation && (
              <>
                <div className="analysis-section-title">
                  FOUR-PARAMETER EVALUATION
                </div>

                <div className="mistakes-card">
                  {parameterItems.map((item) => (
                    <div
                      className="mistake-row"
                      key={item.label}
                    >
                      <div>
                        <strong>
                          {item.label}
                        </strong>

                        <div>
                          {item.value.summary}
                        </div>
                      </div>

                      <strong>
                        {Math.round(item.value.score)}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SENTENCE BREAKDOWN */}
            <div className="analysis-section-title">
              SENTENCE BREAKDOWN
            </div>

            {!evaluation && (
              <div className="analysis-placeholder">
                Your sentence-by-sentence results will
                appear here after you press Check.
              </div>
            )}

            {evaluation &&
              evaluation.sentences.map(
                (sentence) => (
                  <div
                    className="feedback-card"
                    key={sentence.sentenceId}
                  >
                    <div className="feedback-message">
                      <strong>
                        Your sentence
                      </strong>

                      <div>
                        {sentence.learnerText}
                      </div>

                      {sentence.errors.length ===
                        0 && (
                        <div>
                          ✓ No surface errors
                          identified.
                        </div>
                      )}

                      {sentence.errors.map(
                        (error) => (
                          <div
                            key={error.id}
                          >
                            <div>
                              <strong>
                                {error.category ===
                                "word_order"
                                  ? "Word Order"
                                  : error.category ===
                                      "context_form"
                                    ? "Context / Form"
                                    : error.category
                                        .charAt(
                                          0,
                                        )
                                        .toUpperCase() +
                                      error.category.slice(
                                        1,
                                      )}
                              </strong>
                            </div>

                            <div>
                              <strong>
                                Correction:
                              </strong>{" "}
                              {error.correctedText ||
                                "See explanation"}
                            </div>

                            <div>
                              {error.explanation}
                            </div>

                            {error.underlyingConceptIds
                              .length >
                              0 && (
                              <div>
                                <strong>
                                  Learning concepts:
                                </strong>{" "}
                                {error.underlyingConceptIds.join(
                                  ", ",
                                )}
                              </div>
                            )}
                          </div>
                        ),
                      )}

                      {sentence.overallExplanation && (
                        <div>
                          <strong>
                            Explanation:
                          </strong>{" "}
                          {
                            sentence.overallExplanation
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

            {/* DETAILED FEEDBACK */}
            <div className="analysis-section-title">
              DETAILED FEEDBACK
            </div>

            {!evaluation && (
              <div className="feedback-card">
                <div className="feedback-message">
                  Write your German translation and
                  submit it for analysis.
                </div>
              </div>
            )}

            {evaluation && (
              <div className="feedback-card">
                <div className="feedback-message">
                  {evaluation.sentences.length >
                  0
                    ? evaluation.sentences
                        .map(
                          (sentence) =>
                            sentence.overallExplanation,
                        )
                        .filter(Boolean)
                        .join(" ")
                    : "No additional feedback was returned."}
                </div>
              </div>
            )}

            {/* COMMON MISTAKES */}
            <div className="analysis-section-title">
              LEARNING CONCEPTS
            </div>

            {!evaluation && (
              <div className="mistakes-card">
                <div className="mistake-row">
                  <span>
                    • Grammar patterns
                  </span>
                </div>

                <div className="mistake-row">
                  <span>
                    • Word order
                  </span>
                </div>

                <div className="mistake-row">
                  <span>
                    • Vocabulary usage
                  </span>
                </div>

                <div className="mistake-row">
                  <span>
                    • Context / form
                  </span>
                </div>
              </div>
            )}

            {evaluation && (
              <div className="mistakes-card">
                <div className="mistake-row">
                  <span>
                    <strong>
                      Underlying concepts
                    </strong>
                  </span>
                </div>

                {evaluation.underlyingConceptIds
                  .length === 0 && (
                  <div className="mistake-row">
                    <span>
                      No specific underlying
                      concepts identified.
                    </span>
                  </div>
                )}

                {evaluation.underlyingConceptIds.map(
                  (conceptId) => (
                    <div
                      className="mistake-row"
                      key={conceptId}
                    >
                      <span>
                        • {conceptId}
                      </span>
                    </div>
                  ),
                )}

                {evaluation.reinforcementConceptIds
                  .length > 0 && (
                  <>
                    <div className="mistake-row">
                      <span>
                        <strong>
                          Recommended reinforcement
                        </strong>
                      </span>
                    </div>

                    {evaluation.reinforcementConceptIds.map(
                      (conceptId) => (
                        <div
                          className="mistake-row"
                          key={conceptId}
                        >
                          <span>
                            • {conceptId}
                          </span>
                        </div>
                      ),
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="bottom-bar">
        <div>
          Level: <strong>{level}</strong>
        </div>

        <div>
          Exercise: <strong>1 / 25</strong>
        </div>

        <div className="tip">
          💡 Tip: Remember — verbs go to the end in
          <i> weil, dass, wenn </i>
          clauses.
        </div>

        <div className="footer-progress">
          <span>
            Progress: <strong>32%</strong>
          </span>

          <div className="progress-track">
            <div className="progress-value" />
          </div>
        </div>
      </footer>
    </main>
  );
}