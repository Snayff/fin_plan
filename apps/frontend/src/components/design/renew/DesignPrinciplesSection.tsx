import { PatternSection } from "../PatternSection";
import { PatternExample } from "../PatternExample";

const principles = [
  {
    number: 1,
    title: "Waterfall is the Mental Model",
    description:
      "Money flows: Income \u2192 Committed \u2192 Discretionary \u2192 Surplus. The waterfall is not a feature \u2014 it is the identity of the app.",
  },
  {
    number: 2,
    title: "Plan, Not Ledger",
    description:
      "finplan tracks what you intend, not every transaction. Users reconcile actual spending through their bank.",
  },
  {
    number: 3,
    title: "Non-Advisory Guidance",
    description: "Surfaces arithmetic and mechanical options. Never recommends a course of action.",
  },
  {
    number: 4,
    title: "Calm by Default",
    description:
      "Amber is the only attention signal. Red = app errors only. Green = UI confirmations only. Silence = approval.",
  },
  {
    number: 5,
    title: "Non-Judgemental",
    description:
      "Financial values are never colour-coded as good or bad. The app helps \u2014 it does not grade.",
  },
  {
    number: 6,
    title: "Accessibility Over Jargon",
    description:
      "Plain English where possible. Contextual tooltips for financial terms (no in-app glossary).",
  },
  {
    number: 7,
    title: "Desktop-First",
    description: "Desktop is the primary environment. Mobile is deferred.",
  },
  {
    number: 8,
    title: "All Income is Net",
    description: "Take-home pay only. No gross, no tax calculations.",
  },
];

const invariants = [
  "Non-advisory \u2014 mechanics and arithmetic only, never recommendations",
  "Non-judgemental \u2014 no colour-coding financial positions as good/bad",
  "Calm by default \u2014 amber is the only attention signal, silence means everything is fine",
  "Staleness is informational, never blocking",
  "Nudges are one at a time, arithmetic-only, never stacked",
  "Surplus = Income \u2212 Committed \u2212 Discretionary (the cascaded remainder)",
  "Yearly bills use a \u00f712 virtual pot model",
  "Snapshots are read-only",
  "Wizards are the only full-screen mode",
];

const terminologyDo = ["budgeted", "planned", "allocated", "expected"];
const terminologyDont = ["spent", "paid", "charged"];

const advisoryDo = [
  "A surplus of ~10% of income is a common benchmark",
  "Redirecting \u00a3X to Zopa could earn ~\u00a3230 more per year",
  "Your ISA allowance has \u00a311,600 remaining before April",
];
const advisoryDont = [
  "You should increase your savings rate",
  "We recommend moving your savings to Zopa",
  "You should use your ISA allowance",
];

export function DesignPrinciplesSection() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Design Principles</h2>
        <p className="text-sm text-text-secondary max-w-2xl">
          The philosophy, anchors, and language rules that govern every design decision in finplan.
        </p>
      </div>

      {/* Vision */}
      <PatternSection
        id="design-vision"
        title="Vision"
        description="The foundational purpose of finplan."
      >
        <div className="max-w-2xl space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            finplan is a personal financial planning and awareness tool for households. It is not a
            ledger, a bank replacement, or a financial advisor. Its job is to give users a clear,
            honest picture of where their money comes from, where it goes, and where it is heading
            &mdash; and to surface that picture in a way that is always up to date, historically
            traceable, and genuinely useful.
          </p>
          <p>
            The closest analogue is a spreadsheet that a financially organised household might
            maintain: income at the top, committed spend below it, discretionary choices below that,
            and whatever is left at the bottom. finplan makes that structure digital, intelligent,
            and alive.
          </p>
        </div>
      </PatternSection>

      {/* Core Principles */}
      <PatternSection
        id="design-principles"
        title="Core Principles"
        description="The eight anchors that shape every feature and interaction."
      >
        <div className="grid grid-cols-2 gap-4">
          {principles.map((p) => (
            <div key={p.number} className="bg-card border border-border rounded-lg p-4">
              <p className="font-heading font-semibold text-foreground text-sm mb-1">
                <span className="text-text-tertiary mr-1.5">{p.number}.</span>
                {p.title}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </PatternSection>

      {/* Behavioural Invariants */}
      <PatternSection
        id="design-invariants"
        title="Behavioural Invariants"
        description="Hard rules that must never be violated regardless of context."
      >
        <ol
          className="list-decimal list-inside space-y-2 text-sm text-text-secondary max-w-2xl"
          start={9}
        >
          {invariants.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      </PatternSection>

      {/* Language Rules */}
      <PatternSection
        id="design-language"
        title="Language Rules"
        description="Terminology and tone guidelines for all user-facing copy."
      >
        <div className="space-y-6 max-w-2xl">
          {/* Terminology table */}
          <div>
            <p className="text-sm font-heading font-semibold text-foreground mb-3">Terminology</p>
            <div className="grid grid-cols-2 gap-4">
              <PatternExample type="correct" label="Use">
                <ul className="space-y-1 text-sm text-foreground">
                  {terminologyDo.map((t) => (
                    <li key={t}>&ldquo;{t}&rdquo;</li>
                  ))}
                </ul>
              </PatternExample>
              <PatternExample type="avoid" label="Avoid">
                <ul className="space-y-1 text-sm text-foreground">
                  {terminologyDont.map((t) => (
                    <li key={t}>&ldquo;{t}&rdquo;</li>
                  ))}
                </ul>
              </PatternExample>
            </div>
          </div>

          {/* Advisory language table */}
          <div>
            <p className="text-sm font-heading font-semibold text-foreground mb-3">
              Advisory Language
            </p>
            <div className="grid grid-cols-2 gap-4">
              <PatternExample type="correct" label="Acceptable">
                <ul className="space-y-2 text-sm text-foreground">
                  {advisoryDo.map((t) => (
                    <li key={t}>&ldquo;{t}&rdquo;</li>
                  ))}
                </ul>
              </PatternExample>
              <PatternExample type="avoid" label="Not acceptable">
                <ul className="space-y-2 text-sm text-foreground">
                  {advisoryDont.map((t) => (
                    <li key={t}>&ldquo;{t}&rdquo;</li>
                  ))}
                </ul>
              </PatternExample>
            </div>
          </div>
        </div>
      </PatternSection>
    </div>
  );
}
