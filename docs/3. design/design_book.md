1. Product & Business Context (the “why”)

Core goal of the app: Help users to understand their current and future financial position. 
Primary success metric: Net worth growth
Business model: free
Regulatory sensitivity: none

2. Target User Definition (crucial for tone)
Age range(s): mid-life to older
Life stage: mid-career, families, plannign for retirement
Money mindset: Anxious / avoidant, curious but overwhelmed
Accessibility needs: ass accessible as possible. neurodiverse considerate. 

3. Emotional & Brand Positioning (the “vibe”)
How should the app make users feel?: Empowered and motivated. 
What should it not feel like?: judged, corporate. 
Brand personality: friendly, supportive, positive coach

4. Functional Scope (what we’re designing for)
Core features: Budgeting, forecasting, goal tracking.
Data complexity: Simple input, visual breakdowns
User flows: quick population, quick check for being on track, detailed planning sessions.
Platforms: desktop, mobile. secondary
Networking: Offline first.

5. Content & Copy Strategy
Tone of voice: plain, friendly, positive.
Education level: simple explanation inline or on tooltip, deeper explanation lined elsewhere (in app or web)
Terminology constraints: Avoid jargon, use accessible metaphors where helpful. 
Localization plans: english only.

6. Visual Preferences & Constraints
Brand inputs: starting from zero
Color psychology preferences: don't know
Motion & animation: energetic feedback on significant completions. Use animation for pushing focus. Limited motion overall. 
Illustration / icon style: Abstract, friendly, minimal
Dark mode: optional

7. Design System Expectations (how robust?)
Deliverables you want:
- Color system
- Typography scale
- Spacing & layout rules
- Do’s and don’ts
- Accessibility guidelines
Team size & skill level: Solo designer
Longevity: long term

8. Technical & Dev Constraints
Frameworks: React
Charting libraries: rechart
Performance constraints: none


# XXX
1. Design Language North Star
Design Principle Statement

“Make the future feel understandable, not intimidating.”

Every visual decision should reduce uncertainty and cognitive load while quietly encouraging progress.

2. Core Design Principles (these guide everything)

Clarity over cleverness

If something is ambiguous, it’s wrong—even if it looks nice.

Labels beat icons. Context beats minimalism.

Progress without pressure

Show direction and momentum, not failure states.

Avoid red = “you messed up.” Use neutral + constructive cues.

Supportive, not supervisory

The app is beside the user, not above them.

Language and visuals reinforce “you’re learning,” not “you’re behind.”

Calm by default, energy on demand

Most screens should feel steady and breathable.

Save animation and emphasis for meaningful moments.

Accessible is not optional

High contrast, readable type, generous spacing.

Neurodiversity-friendly layouts: predictable, scannable, forgiving.

3. Visual Identity Direction (the “vibe”)
Overall Feel

Warm clarity

Quiet confidence

Friendly but grown-up

Think:

Public library + modern financial coach
Not:
Startup dashboard or bank portal

4. Color System (proposed structure)

Since you’re starting from zero, I’d recommend emotion-first color roles, not brand-first.

Color Roles

You’ll define colors by purpose, not just hue.

1. Core Neutral Palette (60–70%)

Used for most UI surfaces.

Background: soft off-white or very light warm gray

Surface: white or slightly tinted cards

Text primary: near-black (not pure black)

Text secondary: mid-gray with strong contrast

👉 Goal: reduce eye fatigue for older users and long planning sessions.

2. Trust Anchor Color (Primary)

One calm, stable color used sparingly.

Likely candidates:

Muted blue-green

Soft teal

Desaturated navy

Should feel reassuring, not financial-corporate

Used for:

Primary actions

Key indicators

Selected states

3. Growth / Progress Accent

A warmer, optimistic color.

Soft green, muted amber, or gentle coral

Never neon

Used for:

Net worth growth

“On track” indicators

Success states

4. Caution (not danger)

For issues that need attention—but without shame.

Muted amber / warm orange

Avoid red except for true errors (e.g. data loss)

5. Typography System
Font Characteristics (not specific fonts yet)

You want:

High x-height

Open letterforms

Excellent numeral clarity

Friendly, neutral tone

Avoid:

Condensed fonts

Ultra-light weights

Overly geometric faces

Suggested Scale (example)

Display / Section headers: Clear, confident, not huge

Body: Slightly larger than typical fintech apps

UI labels: Never below accessible minimums

Rule of thumb:

If it feels “a bit big,” it’s probably right for this audience.

6. Layout & Spacing Rules
Grid & Density

Generous spacing by default

Clear vertical rhythm

Cards > tables whenever possible

Scanning First

Design for:

Quick check (Am I okay?)

Trend awareness (Where am I going?)

Details on demand

Key Pattern: Progressive Disclosure

Summary → expandable detail → deep dive

Especially important for anxious users

7. Components Philosophy
Cards

Your primary UI building block.

Clear title

One main takeaway

Optional secondary info

Action always obvious

Buttons

Primary actions are obvious and reassuring

Secondary actions are visually quieter

Avoid destructive-looking styles unless truly destructive

Charts (Recharts-friendly)

Fewer lines > more clarity

Always label directly (don’t rely on legends alone)

Annotate trends with plain language:

“Projected to grow steadily if current savings continue”

8. Motion & Feedback
Default State

Minimal motion

No constant animation

Respect reduced-motion settings

Celebrate Meaningful Moments

Use animation for:

Completing setup

Reaching a milestone

Hitting a savings goal

Seeing long-term projection improve

Animation style:

Short

Purposeful

Never flashy

9. Copy + UI Language Rules
Tone

Plain

Warm

Encouraging

Never sarcastic or jokey

Language Guidelines

“You’re on track” > “Success”

“Needs attention” > “Problem”

“Here’s what this means” tooltips everywhere

Metaphors (carefully)

Journey

Weather

Health checkups

Avoid:

Gambling metaphors

Competition

“Crushing it,” “winning,” “failing”

10. Accessibility Baseline (non-negotiables)

WCAG AA contrast minimums

No color-only meaning

Large tap targets

Keyboard-first desktop flows

Predictable layouts

Clear focus states

Tooltips that don’t disappear instantly

11. Do’s & Don’ts (starter)
Do

Explain before asking

Show trends over time

Use white space generously

Reinforce progress visually

Don’t

Shame users for outcomes

Hide meaning behind icons

Use red for anything but errors

Overload dashboards