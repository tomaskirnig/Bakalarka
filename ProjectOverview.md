# Project Overview

Last verified: 2026-04-20  
Commit baseline: 8f75d2f (working tree changes applied)

This document is the implementation-level map of the app.  
It focuses on what actually exists in `src`, which symbols are used, how data moves, and where guardrails are implemented.

---

## 1. What This Project Is

This is a React + Vite SPA for three theoretical-informatics domains:

1. MCVP (Monotone Circuit Value Problem)
2. Combinatorial Game analysis on directed graphs
3. Context-free grammar emptiness analysis

It also provides two conversion pipelines from MCVP:

1. MCVP -> Combinatorial Game
2. MCVP -> Grammar

Core stack:

- React 18
- Vite
- `react-force-graph-2d` + D3 forces
- Bootstrap 5
- `react-toastify`
- Vitest

---

## 2. Runtime Shell and Navigation

## 2.1 App Entry and Page Routing

Main entry:

- `src/main.jsx`
- `src/App.jsx`

`App.jsx` keeps top-level state:

- `currentPage`
- `pageData` (cross-page payload, mainly used by conversion redirects)
- `graphUiSettings`

Pages rendered by `App`:

- `HomePage`
- `MCVP`
- `CombinatorialGame`
- `Grammar`

`handleNavSelection(option, data)` updates page and optional payload.

## 2.2 Global Graph UI Settings

`App.jsx` defines:

```js
const DEFAULT_GRAPH_UI_SETTINGS = {
  useTopDownLayout: true,
  autoScrollToGraph: true,
  lockNodeAfterDrag: true,
};
```

These are managed in `Navigation.jsx` settings modal and passed down to page components.

Notes:

- `useTopDownLayout` is primarily relevant to MCVP visualizations/conversions.
- `autoScrollToGraph` is used in MCVP and Combinatorial Game pages.
- `lockNodeAfterDrag` is used by all graph renderers/editors.

## 2.3 Error and Notification Infrastructure

- Global toasts: `ToastContainer` in `App.jsx`
- Page-level safety: `ErrorBoundary` wraps selected page and uses `key={currentPage}` reset behavior
- Fallback UI: `Common/ErrorPage.jsx`

## 2.4 Dev Server Defaults

- `vite.config.js` sets `server.port` to `5174`
- default local dev URL: `http://localhost:5174/`

---

## 3. Shared Building Blocks

## 3.1 UI Components

- `Common/InputSystem/GenericInputMethodSelector.jsx`
  - standard Manual / Generate / Sets (and MCVP Interactive) selector
- `Common/Modal.jsx`
  - reusable modal with close animation
- `Common/ConversionModal.jsx`
  - large conversion walkthrough modal
- `Common/FileTransferControls.jsx`
  - JSON import/export with drag-drop + optional position-export toggle
- `Common/InfoButton.jsx`
  - hover help popover
- `Common/GraphControls/GraphLockButton.jsx`
  - lock/unlock graph node pinning UI

## 3.2 Hooks

- `Hooks/useGraphSettings.js`
  - central graph rendering constants per domain (`mcvp`, `game`, `grammar`)
- `Hooks/useGraphColors.js`
  - resolves CSS variables into a stable graph color palette

## 3.3 Cross-Cutting Patterns

### Pattern A: Compute Once, Replay by Index

All three domains use the same architecture for explanations:

1. compute analysis once -> `steps[]`
2. open modal -> step component tracks `currentStep`
3. UI only changes index, never reruns algorithm on next/prev

Concrete files:

- MCVP: `evaluateCircuitWithSteps` + `StepByStepTree.jsx`
- Game: `computeWinner` + `StepByStepGame.jsx`
- Grammar: `generateGrammarSteps` + `StepByStepGrammar.jsx`

### Pattern B: Graph Position Persistence

Force-graph coordinates are persisted back into model data to preserve layout consistency across rerenders/import/export.

Concrete behavior:

- MCVP tree rendering persists `x/y` into source nodes
- MCVP export can capture live engine positions via snapshot getter
- Combinatorial game renderers/editors persist `x/y` into internal graph data
- MCVP interactive editor syncs engine-stop positions only when layout changes are pending, using a small coordinate tolerance to avoid periodic twitch loops

### Pattern C: Locking Strategy

Graph lock state is represented with `fx/fy` pinning semantics.

- Lock: set `fx/fy` to current `x/y`
- Unlock: clear `fx/fy` and optionally reheat simulation

---

## 4. Module Deep Dive: Home

Files:

- `Components/HomePage.jsx`
- `Components/HPVisual/NodeVisual.jsx`

`HomePage` renders intro content and background animation component `NetworkVisual`.

`NodeVisual.jsx` implements a canvas particle system:

- node position update + boundary bounce
- pairwise distance checks and line drawing when under threshold
- per-frame complexity approximately `O(N^2)` for link checks

---

## 5. Module Deep Dive: MCVP

Primary container:

- `Components/MCVP/MCVP.jsx`

Primary concern: represent and evaluate monotone circuits as DAG-like node graphs.

## 5.1 Data Model and Invariants

File:

- `Components/MCVP/Utils/NodeClass.js`

Node shape:

- `id` (string)
- `type` (`operation` or `variable`)
- `value` (`A/O` or variable name like `x1`)
- `varValue` for variable nodes (`0/1`)
- `children`, `parents`

Terminology note:

- Many UI labels say "tree", but structure is often a DAG because repeated variables are shared by reference.

## 5.2 Input Flows

### Manual text

Files:

- `InputSelectionComponents/ManualInput.jsx`
- `Utils/Parser.js`

Parser details:

- tokenizer supports `(`, `)`, `A`, `O`, and `xN[0|1]`
- recursive-descent precedence:
  - `parseOrExpr` over `parseAndExpr`
  - `AND` binds tighter than `OR`
- variable identity map enforces consistency:
  - same variable name must not appear with different values
- variable nodes are reused, enabling DAG sharing

### Generated

Files:

- `InputSelectionComponents/GenerateInput.jsx`
- `Utils/Generator.js`

Generator behavior:

- creates variable nodes
- iteratively adds operation nodes with exactly 2 children
- maintains root candidate set and ensures exactly one final root
- feasibility check: `numVariables <= numGates + 1`
- throws + toast on invalid config

### Prepared sets

File:

- `InputSelectionComponents/PreparedSetsInput.jsx`

Loads `Sady/MCVP/*.json` via `import.meta.glob` and converts with:

- `Utils/GraphToTree.js` -> `graphToTree(graphData, options)`

Used options require binary operation nodes and throw on invalid set shape.

### Interactive editor

Files:

- `InputSelectionComponents/Interactive/InteractiveInput.jsx`
- `InteractiveInput.helpers.js`
- `InteractiveInput.renderers.js`
- `InteractiveSelectedNodeControls.jsx`

Editor behavior:

- add AND/OR/variable nodes
- add/delete edges (operation nodes max 2 outgoing)
- update node type/value
- graph continuously converted to internal Node graph via `graphDataToNodeClass`
- background click clears current selection (or cancels edge-adding mode)
- includes geometric fallback picking for background events to mitigate browser canvas color-picking quirks

Interactive mode intentionally allows temporarily incomplete structures while user edits.

## 5.3 Evaluation Algorithm

File:

- `Utils/EvaluateCircuit.js`

Entry:

- `evaluateCircuitWithSteps(root)`

Mechanics:

1. DFS evaluate children first
2. cache completed node values in `memo`
3. detect cycles by tracking active recursion path in `visiting`
4. append step objects `{ node, childValues, result }`
5. append final summary step `{ type: 'FINAL', ... }`

Guardrails:

- null/incomplete operation nodes return `null` instead of hard crash
- cycle throws an error, caught by wrapper, toast shown, returns `{ result: null, steps: [] }`

## 5.4 Visualization

File:

- `TreeRenderCanvas.jsx`

Key details:

- `react-force-graph-2d` with optional DAG mode (`td`)
- custom node and link canvas painters
- supports highlighted/active nodes and completed-step result labels
- includes graph controls: fit + lock
- persists coordinates back to source nodes

Arrow nuance:

- visual arrowheads are intentionally reversed using `Utils/drawReversedArrowhead.js`
- logical data direction remains parent -> child

## 5.5 Import/Export and Validity Gating

Files:

- `Utils/Serialization.js`
- `Utils/GraphToTree.js`

`treeToFlatGraph` supports optional live position snapshot so exported layout matches visible layout.

`MCVP.jsx` enables Explain/Conversion buttons only when tree is evaluable (`evaluation.result !== null`).

---

## 6. Module Deep Dive: Combinatorial Game

Primary container:

- `Components/CombinatorialGame/CombinatorialGame.jsx`

Internal game representation:

- `positions` map, each with `id`, `player`, `children`, `parents`, optional coordinates
- `startingPosition` object with `id`

## 6.1 Input Flows

### Manual editor

Files:

- `InputSelectionComponents/ManualInput/ManualInput.jsx`
- `ManualInput.helpers.js`
- `ManualInput.renderers.js`
- `ManualInputPanels.jsx`

Manual editor maintains graph as `{ nodes, links }`, then converts to analysis format with `toFormattedGraph(graph, startingNodeId)`.

### Generated

Files:

- `InputSelectionComponents/GenerateInput.jsx`
- `Utils/Generator.js`

`generateGraph(numFields, edgeProbability)`:

1. create nodes with random player ownership
2. build spanning backbone from node `0` (reachability guarantee)
3. add random extra edges (cycles possible)

### Prepared sets

File:

- `InputSelectionComponents/PreparedSetsInput.jsx`

Loads `Sady/CombinatorialGame/*.json`, creates internal `positions` graph, and can override starting-node player via radio controls.

## 6.2 Winner Algorithm (Retrograde Analysis)

File:

- `Utils/ComputeWinner.js`

Entry:

- `computeWinner(graph)`

Outputs:

- `hasWinningStrategy`
- `winningPositions` (winner id per node: `0`, `1`, `2`)
- `nodeStatusRaw` (`WIN/LOSE/DRAW` relative to player-to-move at that node)
- `message`
- `steps`

Algorithm outline:

1. initialize all nodes as `DRAW`, track unresolved outgoing degree
2. seed queue with terminal nodes (`LOSE`)
3. process queue and propagate to parents with player-aware branch logic
4. unresolved nodes after propagation stay `DRAW`
5. convert start node status to Player 1 perspective

Complexity:

- approximately `O(V + E)`

Optimal-move extraction:

- `getOptimalMoves(graph, result)` returns edge keys `source-target`
- selects edges from Player 1 winning nodes to Player 1 winning child states

## 6.3 Visualization and Replay

Files:

- `Utils/DisplayGraph.jsx`
- `StepByStepGame.jsx`
- `Utils/GameAnalysisDisplay.jsx`

`DisplayGraph` supports:

- node highlighting and hover context
- dynamic link distance by graph density
- optimal edge highlighting (gold)
- winner labels above nodes (when provided)
- optional lock control and lock-on-first-tick behavior
- position persistence back into graph model

`StepByStepGame` reconstructs partial status map by replaying steps up to current index.

## 6.4 Export/Import Details

`CombinatorialGame.jsx` export supports:

- flat format (`nodes`, `edges`, `startingPosition`)
- internal format conversion from `positions`
- optional `nodePositions` for layout

Import accepts flat, internal, and legacy collection-like payloads.

---

## 7. Module Deep Dive: Grammar

Primary container:

- `Components/Grammar/Grammar.jsx`

Core workflow:

1. load grammar (manual/generate/sets/import)
2. run `isEmptyLanguage(grammar)`
3. show result + optional witness derivation tree
4. open step-by-step explanation modal when requested

## 7.1 Model and Parser

Model file:

- `Utils/Grammar.js`

Parser file:

- `Utils/GrammarParser.js`

Parser behavior:

- supports `->` and `→`
- supports alternatives (`|`)
- supports epsilon (`ε` or `epsilon`)
- enforces non-terminal naming by uppercase-leading symbol (including Czech uppercase)
- classifies all other tokens as terminals

## 7.2 Generator

File:

- `Utils/GrammarGenerator.js`

Entry:

- `generateGrammar(config)`

Highlights:

- generates non-terminals with `S` first
- generates terminals from lowercase symbols
- configurable recursion and epsilon modes
- validates configuration ranges
- ensures reachability of all non-terminals from start symbol
- in `epsilonMode='always'` ensures at least one epsilon production exists

UI complexity estimation is in:

- `InputSelectionComponent/GenerateInput.jsx`

Thresholds:

- warn at `>= 240`
- block at `>= 420`

## 7.3 Emptiness Evaluator and Witness Tree

File:

- `Utils/GrammarEvaluator.js`

Entry:

- `isEmptyLanguage(grammar)`

Phase 1: productive-set fixed point

- seed productive non-terminals from terminal-only/epsilon derivations
- queue-based propagation until no new productive non-terminals

Phase 2: witness (only if non-empty)

- builds compact derivation tree iteratively
- uses shortest-derivation heuristic to reduce recursion risk
- returns derived terminal word from leaves

Safety guardrails:

- max nodes: `1200`
- max depth: `80`
- max non-terminal repeats per path: `4`
- truncation reason surfaced to UI

## 7.4 Step-by-Step Grammar Explanation

Files:

- `Utils/GrammarStepEvaluator.js`
- `StepByStepGrammar.jsx`

`generateGrammarSteps` produces a pedagogical timeline of productive-set growth, not the witness-tree construction itself.

## 7.5 Derivation Tree Rendering

File:

- `DerivationTreeVisual.jsx`

Features:

- DAG top-down layout
- custom node coloring by symbol type (`non-terminal`, `terminal`, `epsilon`)
- drag support with optional lock-after-drag behavior

---

## 8. Conversion Pipelines

## 8.1 MCVP -> Combinatorial Game

Files:

- `Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame.js`
- `Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter.jsx`

Rule mapping:

- OR -> Player 1 node
- AND -> Player 2 node
- variable `1` -> Player 2 terminal node
- variable `0` -> Player 1 terminal node

Mechanics:

- `MCVPToGameStepGenerator` traverses DAG once with visited set
- assigns stable labels `V0`, `V1`, ...
- records step snapshots including partial graph and visual labels

UI converter:

- side-by-side MCVP + Game visualizations
- step navigation
- final redirect button uses `onNavigate('CombinatorialGame', finalGraph)`

## 8.2 MCVP -> Grammar

Files:

- `Conversions/MCVP-Grammar/ConversionGrammar.js`
- `Conversions/MCVP-Grammar/MCVPtoGrammarConverter.jsx`

Core conversion object:

- internal class `MCVPToGrammarConverter` (inside file)

Symbol strategies:

- non-terminals generated by `NonTerminalGenerator` (`S` reserved for root)
- terminals generated by `TerminalGenerator`

Production mapping:

- AND node -> one concatenation production
- OR node -> multiple alternatives
- variable `1` -> terminal or epsilon (15% chance)
- variable `0` -> non-productive loop `X -> X`

Process is split into:

1. node symbol assignment
2. production construction

UI converter:

- side-by-side MCVP + grammar text view
- step navigation and final redirect to Grammar page

---

## 9. Data Contract Summary (Practical)

## 9.1 MCVP Import

Accepted keys:

- required: `nodes` + (`edges` or `links`)
- optional: `positions` map or per-node `x/y`

Normalization entry points:

- `graphToTree(...)`
- `flatGraphToTree(...)`

## 9.2 Combinatorial Game Import

Accepted:

1. flat format (`nodes`, `edges/links`, `startingPosition`)
2. internal format (`positions`, `startingPosition`)

Optional layout field in flat format:

- `nodePositions`

## 9.3 Grammar Import

Accepted:

- single grammar object
- array of grammar objects (first one used)

Validation checks ensure `nonTerminals`, `terminals`, and `productions` exist.

---

## 10. Tests and What They Cover

Test files:

- `tests/mcvp.test.js`
- `tests/mcvp.completeness.test.js`
- `tests/combinatorial-game.test.js`
- `tests/combinatorial-game.completeness.test.js`
- `tests/grammar.test.js`
- `tests/grammar.completeness.test.js`

Coverage highlights:

- MCVP:
  - parser correctness
  - variable reuse + conflict detection
  - evaluator truth-table behavior and cycle handling
  - generator feasibility guard
- Combinatorial Game:
  - winner analysis and draw detection
  - optimal move extraction
  - exhaustive 2-node behavior matrix
  - generator connectivity and self-loop avoidance
- Grammar:
  - parser syntax/validation
  - emptiness detection behavior
  - generator config validation
  - epsilon and rule length constraints

Current gap class (high level):

- UI component behavior is mostly not unit-tested; tests target algorithms/utilities.

---

## 11. Practical Extension Guide

When adding/changing functionality:

1. Update utility algorithm first (and tests).
2. Update page container orchestration.
3. Update step replay component if explanation flow changes.
4. Update import/export shape if data contract changed.
5. Update both docs:
   - `Project_CheatSheet.md` (quick facts)
   - `ProjectOverview.md` (deep details)

Recommended commands:

- `npm run dev` (local default: `http://localhost:5174/`)
- `npm run test`
- `npm run lint`
- `npm run build`

Useful searches:

- `rg "evaluateCircuitWithSteps|computeWinner|isEmptyLanguage|generateGrammarSteps" src`
- `rg "onGraphUpdate|onTreeUpdate|onGrammar|onNavigate" src/Components`

---

## 12. Known Naming Mismatch

The codebase sometimes says "tree" for MCVP structures, but implementation intentionally allows DAG behavior via shared nodes.
