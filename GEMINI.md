# GEMINI AI Context & Rules

This document serves as the primary context for the AI agent ("Gemini") working on this project. It defines the rules, context, and preferences for both the software implementation and the thesis writing.

---

# 💻 Programming (Web Application)

## 🛑 Critical Rules
1.  **NO GIT COMMITS:** 
    *   Do **not** perform git commits, pushes, or stages. 
    *   The user will handle all version control manually.
    *   You may suggest what to commit, but do not execute the command.
2.  **CHECK BEFORE IMPLEMENTING:**
    *   **Always** investigate the codebase first.
    *   Before writing new code, verify if a component, utility, or hook already exists that fulfills the requirement.
    *   Refer to `ProjectOverview.md` for a map of existing functionality.

## 🛠️ Technical Context
*   **Project Type:** Interactive Educational Web Application (SPA).
*   **Core Framework:** React (Vite).
*   **Styling:** Bootstrap 5 (classes), `style.css` (custom).
*   **Visualization:** `react-force-graph-2d`, D3.js.
*   **Key Directories:**
    *   `src/Components`: UI and logic.
    *   `src/Hooks`: Custom hooks (`useGraphColors`, `useGraphSettings`).
    *   `src/Components/*/Utils`: Core algorithms (Evaluators, Parsers, Generators).

## 🧠 Navigation Aid
*   Use `ProjectOverview.md` to understand the high-level architecture.
*   When fixing bugs, trace the data flow from `App.jsx` -> `Page Component` -> `Child Component`.

---

# 🎓 Bachelor Thesis

## 🛑 Critical Rules
1.  **CITATIONS ARE MANDATORY:**
    *   Every definition, theorem, claim, or external concept **must** be cited using `\cite{...}`.
    *   If a source is missing from `bibliography.bib`, ask the user to provide it or suggest adding it.
    *   If possible use the citation from VSB-TUO materials (school from Czech republic).
2.  **WRITING STYLE:**
    *   **Human yet Formal:** Avoid robotic or overly passive text.
    *   **Sentence Variety:** Mix short, punchy sentences with longer, explanatory ones to maintain rhythm.
    *   **Personal Involvement:** It is acceptable (and encouraged) to use the "author's voice" where appropriate (e.g., "Pro implementaci jsme zvolili..." instead of "Bylo zvoleno...").
    *   **Internal Linking:** Frequently use `\ref{sec:...}`, `\ref{fig:...}`, and `\ref{tab:...}` to guide the reader through the text.
    *   **Still formal** The text still has to be formal and scientific.
## 📄 Document Structure
*   **Main File:** `BachelorThesis/BachelorThesis.tex`
*   **Language:** Czech (Main text), English (Abstract).
*   **Images:** All figures are loaded from `BachelorThesis/IMGs/` directory.
*   **Chapter Structure:** 
    > The thesis is structured into several parts. After the introduction follows a chapter dedicated to the technologies used and the application architecture. The core of the thesis consists of three chapters, each focusing in detail on one of the implemented problems: first the Monotone Circuit Value Problem (MCVP), then combinatorial games on graphs, and finally the emptiness problem for context-free grammars. The conclusion summarizes the achieved results and suggests possibilities for further extension.
*   **Chapter Order:**
    1.  `Introduction.tex` - Úvod (Motivation, P-completeness context, thesis goals)
    2.  `Technologies.tex` - Použité technologie a architektura (React, Vite, D3, Bootstrap, Architecture details)
    3.  `MCVP.tex` - Monotone Circuit Value Problem (Theory, Implementation, Reductions to other problems)
    4.  `Games.tex` - Kombinatorické hry (Theory, Minimax/Retrograde analysis, Implementation)
    5.  `Grammars.tex` - Bezkontextové gramatiky (Theory, Emptiness check, Derivation trees)
    6.  `Conclusion.tex` - Závěr (Summary, Future work)

## 🛠️ LaTeX Specifics
*   **Encoding:** UTF-8 (`\usepackage[utf8]{inputenc}`).
*   **Compiling:** Standard `pdflatex` -> `biber` -> `pdflatex`.
