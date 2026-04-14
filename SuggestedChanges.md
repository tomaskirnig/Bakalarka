# Suggested Changes for Bachelor Thesis

This report outlines suggested improvements for your bachelor thesis. These changes focus on academic formality, theoretical precision, and consistency across chapters.

## 1. Title & Abstract Improvements

*   **English Title:**
    *   *Original:* `Component of Teaching Server for Theoretical Computer Science - P-complete problems`
    *   *Suggested:* `Educational Server Component for Theoretical Computer Science: P-complete Problems`
    *   *Reason:* "Educational Server" is more idiomatic than "Teaching Server". Capitalizing "Problems" follows English title casing standards.
*   **Empty String Symbol:**
    *   *Original:* Mixed use of `\epsilon` and `\varepsilon`.
    *   *Suggested:* Standardize to `\varepsilon` throughout the document.
    *   *Reason:* `\varepsilon` is the standard symbol used in Czech formal language theory and computer science.

## 2. Terminology & Formality

*   **Lexical Analysis:**
    *   *Original:* `Tokenizace` / `Tokenizér`
    *   *Suggested:* `Lexikální analýza` / `Lexikální analyzátor`
    *   *Reason:* More formal academic terminology for a bachelor thesis.
*   **Step-by-step processing:**
    *   *Note:* Global replacement of "krokovatelný" with "krokový" has already been performed as requested.

## 3. Theoretical Accuracy (Chapter: Theory)

*   **Reduction Probabilities:**
    *   *Location:* `sec:TheoryReductionToGrammar`
    *   *Issue:* The text mentions a "15% probability" for $\varepsilon$-rules in the context of the theoretical reduction.
    *   *Suggested:* Remove the probability mention from the **Theory** chapter. State only that the reduction maps variables to terminal or $\varepsilon$ rules.
    *   *Reason:* Probabilities are an implementation detail of your specific generator/application, not a property of the mathematical logspace reduction itself. Keep the theory strictly deterministic or general. Mention the 15% detail only in the **Implementation** chapter.

## 4. Typos & Minor Grammar

*   **Introduction (`sec:Introduction`):**
    *   *Original:* `Hlavním bodem tohoto zkoumání...`
    *   *Suggested:* `Ústředním tématem tohoto zkoumání...`
    *   *Reason:* "Ústředním tématem" sounds more professional.
*   **Implementation (`sec:GrammarsWitnessImpl`):**
    *   *Original:* `...iterativní dopočet do ustálení...`
    *   *Suggested:* `...iterativní výpočet do pevného bodu (fixed-point iteration)...`
    *   *Reason:* More precise technical term.

## 5. Non-breaking Spaces (Vlnka `~`)

*   Ensure that all single-letter prepositions (`v`, `z`, `s`, `u`, `o`, `k`) are followed by a non-breaking space `~` instead of a regular space to prevent them from staying at the end of a line.
*   Example: `v~deterministické` instead of `v deterministické`.
