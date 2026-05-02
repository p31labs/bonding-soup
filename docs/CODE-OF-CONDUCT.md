# P31 Code of Conduct

**Version:** 1.0.0  ·  **Effective:** 2026-05-02  ·  **Adapted from:** [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) (CC BY 4.0). Local additions are noted inline and apply only to P31 Labs spaces.

This Code of Conduct applies to every P31 space — the GitHub repository, the issue tracker, pull request reviews, the Discord server (when shipped), the local Ollama fleet contribution lanes, the public hub at `p31ca.org`, and any in-person event organized under the P31 Labs name.

It is enforced by the operator (W. Johnson) until P31 Labs constitutes a Code of Conduct committee, at which point this file is updated to name the committee members and the rotating chair.

---

## 1. Our pledge

We — as members, contributors, and leaders of the P31 Labs community — pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming, varied, inclusive, and healthy community.

---

## 2. Our standards

Examples of behavior that contributes to a positive environment for our community include:

- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience
- Focusing on what is best not just for us as individuals, but for the overall community

Examples of unacceptable behavior include:

- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or email address, without their explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## 3. P31-specific clauses (local additions)

These additions extend Contributor Covenant 2.1 in ways that are specific to P31's mission, our operator's medical and cognitive condition, and the doctrines named in `docs/P31-MANIFESTO.md`.

### 3.1 Voice doctrine adherence

Public-facing copy in pull requests is held to the **DELTA language** (`docs/P31-DELTA-LANGUAGE.md`) and **Public Voice** (`docs/PUBLIC-VOICE.md`) standards. Comments that frame this as bureaucratic, "just style," or otherwise dismiss the doctrine will be treated as a Code of Conduct concern. The doctrine is enforced because plain language is an accessibility feature.

Specifically: marketing words on the avoid-list (`unlock`, `delve`, `empower`, `synergy`, `revolutionary`, `cutting-edge`, etc.) and naval/military metaphors are not stylistic preferences. They are doctrine. Pull requests that ignore the gate after one round of review feedback will be closed.

### 3.2 No medical advice on public surfaces

P31 is sub-medical-grade by design (Manifesto Doctrine 5). No contributor may add to a public surface — hub page, README, persona system prompt, or social media post — language that could be read as a clinical recommendation, diagnosis, dosing instruction, or substitute for professional care.

This includes, but is not limited to: calcium dosing, hypoparathyroidism management, AuDHD treatment, mental-health crisis response, and any prescription drug guidance. The operator's own condition is documented in `CLAUDE.md` and `.cursorrules` for agent context, not as a medical resource.

If a contributor believes a medical claim is necessary for safety (e.g. a 911 callout on a crisis page), open an issue and the operator will draft the language with appropriate review.

### 3.3 K₄ family mesh confidentiality

The K₄ family mesh contains four named members: `will`, `S.J.`, `W.J.`, `christyn` (vertex IDs). Children's full names are protected by initials policy (S.J., W.J. — see `.cursorrules` §1).

Contributors must not:

- Refer to the children by full name in any commit, issue, PR, code comment, or public document
- Publish the contents of mesh state (love totals, edge weights, personal pillar data) outside the operator's explicit consent
- Use mesh data in screenshots or demos without redaction

This is a hard rule. Violations will be treated as a serious Code of Conduct concern.

### 3.4 Operator-condition awareness

The operator's hypoparathyroidism creates real-time cognitive variability. Calcium-deficit days are not "low effort" or "lazy" — they are a medical state. Contributors are asked to:

- Read messages charitably when the operator's tone is short or commands are terse — these are spoon-deficit signals, not dismissal
- Not press for synchronous response in operator-confidential channels (counsel, triage personas) — the operator may need to disengage and return
- Respect "Spoon deficit" notices as a hard pause, not a negotiation

This is a clause specific to the current single-operator structure. As P31 Labs grows beyond one operator, this clause will be replaced with the broader inclusion language already in §1.

### 3.5 No surveillance of children

Persona system prompts that interact with children (currently `p31-phos`) are subject to additional review. They must not:

- Log or transmit conversation content beyond the local device
- Profile the child for any purpose, including "improving the experience"
- Be used as a surveillance tool by parents or guardians

Parents have the right to set boundaries on what tools their children use. P31's role is to make the boundary respectable, not to inspect what happens inside it. See `docs/PLAN-KIDS-VIBE-CODING.md` and the SoulSafe spec.

### 3.6 No engagement-maximization patterns

Streaks, FOMO hooks, infinite scroll, push-notification cadence tuning, "you have unread items" badges that nag, and any other engagement-maximization pattern from the consumer-app playbook is off-doctrine. Pull requests adding these will be closed.

### 3.7 No cloud LLM in operator-confidential surfaces

The Ollama fleet personas `p31-counsel`, `p31-triage`, and `p31-phos` are operator-confidential. Routing their prompts through any cloud LLM endpoint is a hard ban (see `.cursor/rules/p31-ollama-fleet.mdc`). PRs that violate this rule will be closed and the contributor will receive a Code of Conduct correction (Enforcement §4.2).

---

## 4. Enforcement responsibilities

Community leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.

Community leaders have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, and will communicate reasons for moderation decisions when appropriate.

Until a Code of Conduct committee is constituted, the **operator** (W. Johnson) is the sole enforcement authority. The committee structure is documented in §6 below.

---

## 5. Scope

This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces. Examples of representing our community include using an official email address, posting via an official social media account, or acting as an appointed representative at an online or offline event.

For P31 specifically, "community spaces" includes:

- The home repository (`p31labs/bonding-soup` and any forked or downstream repos)
- The Andromeda monorepo (`p31labs/andromeda`)
- The p31ca hub repository
- Any GitHub Discussion under the `p31labs` organization
- Any Discord server, Slack workspace, or chat channel operated by P31 Labs (none today; structure when shipped)
- The public hub at `p31ca.org`, the donation surface, and any phosphorus31.org pages
- In-person events organized under the P31 Labs name

---

## 6. Reporting

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement at:

- **Email:** `conduct@p31labs.org` (forwards to the operator until the committee is constituted)
- **Until the email domain is live:** open a private security advisory on `github.com/p31labs/bonding-soup` (the same channel as security reports — the operator triages both)
- **In-person crisis or threat to safety:** local emergency services first, then the channels above

All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the reporter of any incident.

---

## 7. Enforcement guidelines

Community leaders will follow these Community Impact Guidelines in determining the consequences for any action they deem in violation of this Code of Conduct:

### 7.1 Correction

**Community Impact:** Use of inappropriate language or other behavior deemed unprofessional or unwelcome in the community.

**Consequence:** A private, written warning from community leaders, providing clarity around the nature of the violation and an explanation of why the behavior was inappropriate. A public apology may be requested.

### 7.2 Warning

**Community Impact:** A violation through a single incident or series of actions.

**Consequence:** A warning with consequences for continued behavior. No interaction with the people involved, including unsolicited interaction with those enforcing the Code of Conduct, for a specified period of time. This includes avoiding interactions in community spaces as well as external channels like social media. Violating these terms may lead to a temporary or permanent ban.

### 7.3 Temporary ban

**Community Impact:** A serious violation of community standards, including sustained inappropriate behavior.

**Consequence:** A temporary ban from any sort of interaction or public communication with the community for a specified period of time. No public or private interaction with the people involved, including unsolicited interaction with those enforcing the Code of Conduct, is allowed during this period. Violating these terms may lead to a permanent ban.

### 7.4 Permanent ban

**Community Impact:** Demonstrating a pattern of violation of community standards, including sustained inappropriate behavior, harassment of an individual, or aggression toward or disparagement of classes of individuals.

**Consequence:** A permanent ban from any sort of public interaction within the community.

---

## 8. Enforcement record (public)

Anonymized enforcement actions taken under this Code of Conduct will be summarized annually in the P31 Transparency Report (`docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2A). Counts only — no names, no quotes — unless the reported party requests their case be made public for accountability reasons.

If no enforcement actions occurred in a year, the Transparency Report will say so explicitly. Silence is not the same as zero.

---

## 9. Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 2.1, available at [https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

Community Impact Guidelines were inspired by [Mozilla's code of conduct enforcement ladder][mozilla coc].

For answers to common questions about this code of conduct, see the FAQ at [https://www.contributor-covenant.org/faq][faq]. Translations are available at [https://www.contributor-covenant.org/translations][translations].

The P31-specific clauses in §3 are original to this project and licensed under the same terms as the rest of the P31 documentation (see `docs/LICENSE-POLICY.md`).

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
[mozilla coc]: https://github.com/mozilla/diversity
[faq]: https://www.contributor-covenant.org/faq
[translations]: https://www.contributor-covenant.org/translations

---

*Code of Conduct version 1.0.0 — 2026-05-02. Companion to `docs/P31-MANIFESTO.md` (Commitment C2).*
