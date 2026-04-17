# TEMP Refactor Cleanup Tracker

Created: 2026-04-15
Purpose: single place to track cleanup/refactor progress across logic files.
Workflow: move one file at a time from TODO -> IN PROGRESS -> DONE.

## Definition Of Done For Each File

- Remove dead code and stale comments.
- Simplify complex state/branches where safe.
- Keep behavior unchanged unless explicitly planned.
- Keep imports and naming consistent.
- Run lint/tests relevant to touched area.
- Add a short note if cleanup was skipped intentionally.

## Status Legend

- [ ] TODO
- [x] DONE

## Root And App Shell

- [x] eslint.config.js
- [x] vite.config.js
- [x] vitest.config.js
- [x] src/main.jsx
- [x] src/App.jsx

## Hooks

- [x] src/Hooks/useGraphSettings.js
- [x] src/Hooks/useGraphColors.js

## Shared Components

- [x] src/Components/Navigation.jsx
- [x] src/Components/HomePage.jsx
- [x] src/Components/Common/Modal.jsx
- [x] src/Components/Common/ConversionModal.jsx
- [x] src/Components/Common/ErrorBoundary.jsx
- [x] src/Components/Common/ErrorPage.jsx
- [x] src/Components/Common/FileTransferControls.jsx
- [x] src/Components/Common/InfoButton.jsx
- [x] src/Components/Common/GraphControls/GraphLockButton.jsx
- [x] src/Components/Common/InputSystem/GenericInputMethodSelector.jsx
- [x] src/Components/HPVisual/NodeVisual.jsx

## MCVP Core

- [x] src/Components/MCVP/MCVP.jsx
- [x] src/Components/MCVP/StepByStepTree.jsx
- [x] src/Components/MCVP/TreeRenderCanvas.jsx

## MCVP Utilities

- [x] src/Components/MCVP/Utils/Serialization.js
- [x] src/Components/MCVP/Utils/Parser.js
- [x] src/Components/MCVP/Utils/NodeClass.js
- [x] src/Components/MCVP/Utils/GraphToTree.js
- [x] src/Components/MCVP/Utils/Generator.js
- [x] src/Components/MCVP/Utils/EvaluateCircuit.js
- [x] src/Components/MCVP/Utils/drawReversedArrowhead.js

## MCVP Input Components

- [x] src/Components/MCVP/InputSelectionComponents/GenerateInput.jsx
- [x] src/Components/MCVP/InputSelectionComponents/ManualInput.jsx
- [x] src/Components/MCVP/InputSelectionComponents/PreparedSetsInput.jsx
- [x] src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.jsx
- [x] src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.helpers.js
- [x] src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.renderers.js
- [x] src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveSelectedNodeControls.jsx

## Grammar Core

- [x] src/Components/Grammar/Grammar.jsx
- [x] src/Components/Grammar/StepByStepGrammar.jsx
- [x] src/Components/Grammar/DerivationTreeVisual.jsx

## Grammar Utilities

- [x] src/Components/Grammar/Utils/Grammar.js
- [x] src/Components/Grammar/Utils/GrammarEvaluator.js
- [x] src/Components/Grammar/Utils/GrammarGenerator.js
- [x] src/Components/Grammar/Utils/GrammarParser.js
- [x] src/Components/Grammar/Utils/GrammarStepEvaluator.js

## Grammar Input Components

- [x] src/Components/Grammar/InputSelectionComponent/GenerateInput.jsx
- [x] src/Components/Grammar/InputSelectionComponent/ManualInput.jsx
- [x] src/Components/Grammar/InputSelectionComponent/PreparedSetsInput.jsx

## Combinatorial Game Core

- [x] src/Components/CombinatorialGame/CombinatorialGame.jsx
- [x] src/Components/CombinatorialGame/StepByStepGame.jsx

## Combinatorial Game Utilities

- [x] src/Components/CombinatorialGame/Utils/ComputeWinner.js
- [x] src/Components/CombinatorialGame/Utils/DisplayGraph.jsx
- [x] src/Components/CombinatorialGame/Utils/GameAnalysisDisplay.jsx
- [x] src/Components/CombinatorialGame/Utils/Generator.js
- [x] src/Components/CombinatorialGame/Utils/NodeClasses.js

## Combinatorial Game Input Components

- [x] src/Components/CombinatorialGame/InputSelectionComponents/GenerateInput.jsx
- [x] src/Components/CombinatorialGame/InputSelectionComponents/PreparedSetsInput.jsx
- [x] src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.jsx
- [x] src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.helpers.js
- [x] src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.renderers.js
- [x] src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInputPanels.jsx

## Conversions

- [x] src/Components/Conversions/MCVP-Grammar/ConversionGrammar.js
- [x] src/Components/Conversions/MCVP-Grammar/MCVPtoGrammarConverter.jsx
- [x] src/Components/Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame.js
- [x] src/Components/Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter.jsx

## Tests

- [x] tests/mcvp.test.js
- [x] tests/mcvp.completeness.test.js
- [x] tests/grammar.test.js
- [x] tests/grammar.completeness.test.js
- [x] tests/combinatorial-game.test.js
- [x] tests/combinatorial-game.completeness.test.js

## Progress Log

- 2026-04-15: Tracker created with full logic-file inventory.
- 2026-04-16: eslint.config.js reviewed and marked DONE (no safe cleanup needed; behavior already clean).
- 2026-04-16: vite.config.js cleaned (removed stale boilerplate comment) and marked DONE.
- 2026-04-16: vitest.config.js reviewed and marked DONE (no safe cleanup needed; already minimal).
- 2026-04-16: src/main.jsx reviewed and marked DONE (no safe cleanup needed; entrypoint already clear).
- 2026-04-16: src/App.jsx cleaned by replacing repeated page-condition branches with a single component map render path.
- 2026-04-16: src/Hooks/useGraphSettings.js reviewed and marked DONE (no safe cleanup needed; settings structure already clear).
- 2026-04-16: src/Hooks/useGraphColors.js cleaned by extracting shared defaults/CSS-var resolver to remove duplicated fallback values.
- 2026-04-16: Shared Components section completed. Cleanups applied in Navigation.jsx, Modal.jsx, ConversionModal.jsx, ErrorBoundary.jsx, FileTransferControls.jsx, GraphLockButton.jsx, and GenericInputMethodSelector.jsx.
- 2026-04-16: Shared Components review-only (no safe cleanup needed): HomePage.jsx, ErrorPage.jsx, and InfoButton.jsx.
- 2026-04-16: HPVisual/NodeVisual.jsx reviewed and marked DONE; deep hook-dependency cleanup intentionally deferred to avoid risky animation lifecycle changes in this pass.
- 2026-04-16: src/Components/MCVP/MCVP.jsx cleaned by extracting shared input options and deduplicating tree-validity action guard logic.
- 2026-04-16: src/Components/MCVP/StepByStepTree.jsx cleaned with safer functional step navigation, index clamping on data changes, and explicit button types.
- 2026-04-16: src/Components/MCVP/TreeRenderCanvas.jsx cleaned with explicit center-button type to avoid unintended form submission.
- 2026-04-16: src/Components/MCVP/Utils/Serialization.js cleaned by simplifying traversal internals (queue index) without changing exported graph shape.
- 2026-04-16: src/Components/MCVP/Utils/Parser.js cleaned by deduplicating operation-node parent-link creation and removing stale debug comment.
- 2026-04-16: src/Components/MCVP/Utils/NodeClass.js reviewed and marked DONE (no safe cleanup needed; class remains minimal and clear).
- 2026-04-16: src/Components/MCVP/Utils/GraphToTree.js cleaned by extracting endpoint/position resolution helpers to reduce repeated branches.
- 2026-04-16: src/Components/MCVP/Utils/Generator.js cleaned by centralizing toast+throw generation error handling while preserving original messages.
- 2026-04-16: src/Components/MCVP/Utils/EvaluateCircuit.js cleaned by centralizing AND/OR operator alias checks.
- 2026-04-16: src/Components/MCVP/Utils/drawReversedArrowhead.js cleaned by replacing magic numbers with named constants.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/GenerateInput.jsx cleaned by extracting shared clamped-number parsing and adding explicit button type.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/ManualInput.jsx cleaned with named node-limit constant and explicit parse-button type.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/PreparedSetsInput.jsx cleaned with clearer prepared-set constant naming, boolean filtering, and explicit index parsing radix.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.jsx cleaned with explicit button types, shared interactive node-limit constant, and stable canvas mode accessors.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.helpers.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveInput.renderers.js cleaned by reusing shared node display label helper.
- 2026-04-16: src/Components/MCVP/InputSelectionComponents/Interactive/InteractiveSelectedNodeControls.jsx cleaned with robust link-endpoint resolution and explicit button types.
- 2026-04-16: src/Components/Grammar/Grammar.jsx cleaned by extracting shared input options, simplifying derived-word conditional rendering, and adding explicit explain-button type.
- 2026-04-16: src/Components/Grammar/StepByStepGrammar.jsx cleaned with safer step navigation state updates, index clamping, unconditional memoized derivations, and explicit button types.
- 2026-04-16: src/Components/Grammar/DerivationTreeVisual.jsx cleaned with stable fit callback and explicit center-button type.
- 2026-04-16: Grammar Core lint run completed; only pre-existing warnings remain in HPVisual/NodeVisual.jsx.
- 2026-04-16: src/Components/Grammar/Utils/Grammar.js cleaned by simplifying grammar-to-text line assembly.
- 2026-04-16: src/Components/Grammar/Utils/GrammarEvaluator.js cleaned with terminal-set lookup and queue-index iteration in productive-symbol propagation.
- 2026-04-16: src/Components/Grammar/Utils/GrammarGenerator.js cleaned with queue-index reachability traversal, set membership checks, and nullish defaults for production-count bounds.
- 2026-04-16: src/Components/Grammar/Utils/GrammarParser.js cleaned with shared missing-rules error helper and reduced mutable bindings.
- 2026-04-16: src/Components/Grammar/Utils/GrammarStepEvaluator.js cleaned with terminal-set checks, queue-index work-list traversal, and shared rule-string formatter.
- 2026-04-16: src/Components/Grammar/InputSelectionComponent/GenerateInput.jsx cleaned with parse API consistency, config shorthand, and explicit button types.
- 2026-04-16: src/Components/Grammar/InputSelectionComponent/ManualInput.jsx cleaned by removing redundant return in catch block and adding explicit parse-button type.
- 2026-04-16: src/Components/Grammar/InputSelectionComponent/PreparedSetsInput.jsx cleaned with prepared-set constant naming consistency, boolean filtering, explicit index parsing, and stable option keys.
- 2026-04-16: src/Components/CombinatorialGame/CombinatorialGame.jsx cleaned by extracting shared input options, centralizing selected-player mismatch check, and adding explicit explain-button type.
- 2026-04-16: src/Components/CombinatorialGame/StepByStepGame.jsx cleaned with safer step index clamping/navigation updates, extracted active-step winner labeling helper, and explicit control-button types.
- 2026-04-16: src/Components/CombinatorialGame/Utils/ComputeWinner.js cleaned with queue-index work-list traversal and reduced repeated start-position lookup.
- 2026-04-16: src/Components/CombinatorialGame/Utils/DisplayGraph.jsx cleaned with stable node-canvas mode accessor, stable fit callback, explicit center-button type, and precise Set prop-type for optimal moves.
- 2026-04-16: src/Components/CombinatorialGame/Utils/GameAnalysisDisplay.jsx reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: src/Components/CombinatorialGame/Utils/Generator.js cleaned by extracting shared edge-insertion helper and using explicit start-node key access.
- 2026-04-16: src/Components/CombinatorialGame/Utils/NodeClasses.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/GenerateInput.jsx cleaned with shared clamped-int parser, fixed edge-probability setter naming, and explicit generate-button type.
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/PreparedSetsInput.jsx cleaned with prepared-set constant naming consistency, boolean filtering, id-string helper, explicit index parsing radix, and stable option keys.
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.jsx cleaned by removing stale debug comment, using parse API consistency, extracting stable fit callback and canvas mode accessor, and adding explicit button types.
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.helpers.js cleaned by pre-indexing links for formatted-graph assembly and safely normalizing starting-node extraction for object-or-primitive payloads.
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.renderers.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInputPanels.jsx cleaned with explicit button types and stable edge-derived keys for delete-edge actions.
- 2026-04-16: Combinatorial Game Input Components lint run completed; touched files passed with no new warnings/errors (only pre-existing warnings remain in HPVisual/NodeVisual.jsx).
- 2026-04-16: src/Components/Conversions/MCVP-Grammar/ConversionGrammar.js reviewed and marked DONE (no safe cleanup needed; class remains minimal and focused).
- 2026-04-16: src/Components/Conversions/MCVP-Grammar/MCVPtoGrammarConverter.jsx cleaned with minor object shorthand consistency and explicit button types for conversion navigation/actions.
- 2026-04-16: src/Components/Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame.js cleaned by removing unused converter state and centralizing OR/AND node-value recognition.
- 2026-04-16: src/Components/Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter.jsx cleaned by extracting shared fit-reset delay handling and adding explicit button types for conversion controls.
- 2026-04-16: Conversions lint run completed; touched files passed with no new warnings/errors (only pre-existing warnings remain in HPVisual/NodeVisual.jsx).
- 2026-04-16: tests/mcvp.test.js reviewed and marked DONE (no safe cleanup needed; coverage remains focused and clear).
- 2026-04-16: tests/mcvp.completeness.test.js cleaned by aligning invalid-operation-arity expectation with evaluator contract (incomplete interactive nodes return null without toast error).
- 2026-04-16: tests/grammar.test.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: tests/grammar.completeness.test.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: tests/combinatorial-game.test.js reviewed and marked DONE (no safe cleanup needed).
- 2026-04-16: tests/combinatorial-game.completeness.test.js cleaned with explicit node-id constants and queue-index BFS traversal for consistency.
- 2026-04-16: Tests section lint run completed; touched files passed with no new warnings/errors (only pre-existing warnings remain in HPVisual/NodeVisual.jsx).
- 2026-04-16: Tests section execution run completed; targeted suites passed (28/28 tests, 6/6 files).
