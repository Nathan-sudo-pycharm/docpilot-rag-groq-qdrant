# Credits & Acknowledgments

A transparent note on how this project was built and with what help.

---

## Built By

**Nathan Ivor Sequeira** — final-year BCA student, building toward AI-adjacent backend/infrastructure roles.

Portfolio: [nathansequeirafinal.vercel.app](https://nathansequeirafinal.vercel.app)
GitHub: [github.com/Nathan-sudo-pycharm](https://github.com/Nathan-sudo-pycharm)

---

## AI Assistance Used

This project was built with significant help from **Claude (Anthropic)**, used across the full build process as a learning and engineering tool:

- **Git workflow** — branching strategy, commit conventions, merge/rebase concepts, and recovering from mistakes were taught step-by-step throughout the build, documented in `git-learning-log.md`
- **Debugging** — multiple real bugs were diagnosed and fixed with Claude's help, including Windows-specific environment issues (Smart App Control blocking compiled dependencies, missing Visual C++ Redistributables), library API version mismatches (LangChain, qdrant-client), and a Tailwind v4 dark-mode caching bug — all documented in the day-by-day engineering notes in `Documentation/notes/`
- **Architecture and planning** — the overall day-by-day build plan, the decision to pivot from Groq embeddings (which don't exist) to local `sentence-transformers`, and the two-panel UI architecture were worked out collaboratively
- **TypeScript/React instruction** — concepts like interfaces, hooks, the `prev =>` state updater pattern, and props/destructuring were taught from a beginner level as part of the build process, not assumed knowledge

**What this means in practice:** every line of code in this repository was reviewed, tested, and run by Nathan personally — nothing was blindly copy-pasted without understanding. Claude's role was closer to a pair-programming mentor than an autonomous code generator: explaining concepts, suggesting fixes, and helping plan the work, while Nathan made every actual change, ran every test, and debugged every real error against his own running environment.

---

## Design

The UI design was prototyped using **[Emergent](https://emergent.sh)**, an AI app-builder, based on a written design brief specifying a Vercel/Linear-inspired aesthetic (clean, minimal, restrained use of color, light/dark theming). The resulting visual design — layout, color palette, typography choices (Geist Mono for technical text) — was then manually reimplemented as real, hand-written React/TypeScript components rather than using Emergent's generated code directly. The full design specification extracted from that process lives in `Documentation/design-reference.md`.

---

## Why This Transparency Matters

AI-assisted development is increasingly normal, and being upfront about how tools were used is more useful to anyone reviewing this project than pretending otherwise. What should be evaluated is whether the underlying engineering decisions are sound, whether the code is well-understood by its author, and whether the person who built it can explain and extend it — not whether any particular line was typed by a human or suggested by a model first.