"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import { ROUTES } from "@/lib/routes";
import type { Answers, ContactInfo, Notes, RouteId } from "@/lib/types";
import CalendarEmbed from "./CalendarEmbed";

type Phase = "intro" | "questions" | "contact" | "submitting" | "result" | "error";

interface ServerResult {
  route: RouteId;
  score: number;
  maxScore: number;
  calendarEmbedUrl: string | null;
  resourceUrl?: string | null;
}

const TOTAL_STEPS = QUESTIONS.length + 1; // questions + contact
const STORAGE_KEY = "tmwt_qualifier_v1";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [notes, setNotes] = useState<Notes>({});
  const [contact, setContact] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [result, setResult] = useState<ServerResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Restore in-progress answers after a page refresh, and persist as the user
  // goes so nothing is lost (client-requested fix).
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.answers) setAnswers(s.answers);
        if (s.notes) setNotes(s.notes);
        if (s.contact) setContact((c) => ({ ...c, ...s.contact }));
        if (typeof s.qIndex === "number") {
          setQIndex(Math.min(Math.max(s.qIndex, 0), QUESTIONS.length - 1));
        }
        if (s.phase === "questions" || s.phase === "contact") setPhase(s.phase);
      }
    } catch {
      /* ignore corrupt storage */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    // Only persist resumable phases; clear once they've completed.
    if (phase === "submitting" || phase === "result") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, notes, contact, qIndex, phase }),
      );
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [answers, notes, contact, qIndex, phase]);

  const question = QUESTIONS[qIndex];

  function selectOption(value: string) {
    const q = QUESTIONS[qIndex];
    setAnswers((a) => ({ ...a, [q.id]: value }));
    if (!q.allowMore) {
      // Auto-advance for clean single-choice questions.
      window.setTimeout(() => advance(), 240);
    }
  }

  function advance() {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      setPhase("contact");
    }
  }

  function back() {
    if (phase === "contact") {
      setPhase("questions");
      setQIndex(QUESTIONS.length - 1);
      return;
    }
    if (qIndex === 0) {
      setPhase("intro");
    } else {
      setQIndex((i) => i - 1);
    }
  }

  function validEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validPhone(phone: string) {
    return phone.replace(/\D/g, "").length >= 10;
  }

  const contactValid =
    contact.firstName.trim().length > 0 &&
    validEmail(contact.email.trim()) &&
    validPhone(contact.phone);

  /** For allowMore questions: is the answer chosen and any required text filled? */
  function canContinue(): boolean {
    const sel = answers[question.id];
    if (!sel) return false;
    if (question.moreRequiredForValue && sel === question.moreRequiredForValue) {
      return Boolean((notes[question.id] || "").trim());
    }
    return true;
  }

  async function submit() {
    setPhase("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, answers, notes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Something went wrong (${res.status}).`);
      }
      const data = (await res.json()) as ServerResult;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setResult(data);
      setPhase("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error. Please try again.");
      setPhase("error");
    }
  }

  // Progress: questions completed + contact step.
  const completed = phase === "contact" ? QUESTIONS.length : qIndex;
  const progressPct = Math.round((completed / TOTAL_STEPS) * 100);

  return (
    <div className="card">
      <div className="brandbar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Talk Money With Tish" />
          <span>Talk Money With Tish</span>
        </div>

        <div className="card-body">
          {phase === "intro" && <Intro onStart={() => setPhase("questions")} />}

          {phase === "questions" && (
            <>
              <div className="progress" aria-hidden>
                <i style={{ width: `${progressPct}%` }} />
              </div>
              <div className="step-meta">
                Question {qIndex + 1} of {QUESTIONS.length}
              </div>
              <h2
                className="q-prompt"
                dangerouslySetInnerHTML={{ __html: question.prompt }}
              />
              {question.helper && <p className="q-helper">{question.helper}</p>}

              <div className="options">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`option${selected ? " selected" : ""}`}
                      onClick={() => selectOption(opt.value)}
                    >
                      <span className="bullet" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {question.allowMore && (() => {
                const moreRequired =
                  question.moreRequiredForValue &&
                  answers[question.id] === question.moreRequiredForValue;
                return (
                  <div className="more">
                    <textarea
                      placeholder={
                        moreRequired
                          ? "Required — tell us in your own words…"
                          : question.morePlaceholder || "Optional — tell us more."
                      }
                      value={notes[question.id] || ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [question.id]: e.target.value }))
                      }
                    />
                    {moreRequired && !(notes[question.id] || "").trim() && (
                      <p className="more-hint">Please add a sentence so we can match you well.</p>
                    )}
                  </div>
                );
              })()}

              <div className="nav">
                <button type="button" className="btn btn-ghost" onClick={back}>
                  ← Back
                </button>
                {question.allowMore && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canContinue()}
                    onClick={advance}
                  >
                    Continue
                  </button>
                )}
              </div>
            </>
          )}

          {phase === "contact" && (
            <>
              <div className="progress" aria-hidden>
                <i style={{ width: `${progressPct}%` }} />
              </div>
              <div className="step-meta">Last step</div>
              <h2 className="q-prompt">Where should we send your details?</h2>
              <p className="q-helper">
                We'll match you with the right next step and hold your spot.
              </p>

              <div className="field-row">
                <div className="field-group">
                  <label className="field" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={contact.firstName}
                    onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  />
                </div>
                <div className="field-group">
                  <label className="field" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={contact.lastName}
                    onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </div>

              <div className="field-group">
                <label className="field" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
                <p className="more-hint">We'll only use this to reach you about your appointment.</p>
              </div>

              <div className="nav">
                <button type="button" className="btn btn-ghost" onClick={back}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!contactValid}
                  onClick={submit}
                >
                  See my next step →
                </button>
              </div>
            </>
          )}

          {phase === "submitting" && (
            <div className="center">
              <div className="spinner" />
              <p className="q-helper center">Finding your best next step…</p>
            </div>
          )}

          {phase === "result" && result && (
            <Result result={result} contact={contact} />
          )}

          {phase === "error" && (
            <div className="center">
              <h2 className="q-prompt">Hmm, that didn't go through.</h2>
              <p className="error-text">{errorMsg}</p>
              <div style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-primary" onClick={submit}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro">
      <div className="step-meta">2-minute fit check</div>
      <h1>Ready when you are.</h1>
      <p>No wrong answers — just answer honestly and we'll match you to the right next step.</p>
      <ul>
        <li>8 short questions — no wrong answers</li>
        <li>Takes about two minutes</li>
        <li>We'll match you and hold your spot instantly</li>
      </ul>
      <button type="button" className="btn btn-primary btn-block" onClick={onStart}>
        Let's begin →
      </button>
    </div>
  );
}

function Result({ result, contact }: { result: ServerResult; contact: ContactInfo }) {
  const cfg = ROUTES[result.route];

  // "Not a fit" — a polite decline with optional free resources. No booking,
  // and never the "our team will reach out to lock in your time" message.
  if (cfg.noBooking) {
    return (
      <div className="result">
        <span className="badge">{cfg.name}</span>
        <h1>{cfg.headline}</h1>
        <p className="blurb">{cfg.blurb}</p>
        {result.resourceUrl && (
          <div style={{ marginTop: 20 }}>
            <a
              className="btn btn-primary"
              href={result.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore free resources →
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="result">
      <span className="badge">{cfg.name}</span>
      <h1>{cfg.headline}</h1>
      <p className="blurb">{cfg.blurb}</p>

      <div className="step-meta">{cfg.bookingLabel}</div>
      {result.calendarEmbedUrl ? (
        <CalendarEmbed url={result.calendarEmbedUrl} />
      ) : (
        <div className="fallback">
          <strong>You're all set.</strong> We've got your details
          {contact.email ? ` (${contact.email})` : ""} and our team will reach out
          shortly to lock in your time.
        </div>
      )}
    </div>
  );
}
