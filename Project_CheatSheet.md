# Project Cheat Sheet

Last verified: 2026-04-26  
Commit baseline: 2c60481 (working tree changes applied)

Purpose: quick implementation reference for algorithms, data flow, guardrails, and file locations.

## 1. Fast Project Map

Main app entry:

- `src/main.jsx`
- `src/App.jsx`

Main pages:

- Home: `src/Components/HomePage.jsx`
- MCVP: `src/Components/MCVP/MCVP.jsx`
- Combinatorial Game: `src/Components/CombinatorialGame/CombinatorialGame.jsx`
- Grammar: `src/Components/Grammar/Grammar.jsx`

Navigation and global graph UI settings:

- `src/Components/Navigation.jsx`
- global settings in `App.jsx`: `useTopDownLayout`, `autoScrollToGraph`, `lockNodeAfterDrag`

Development server:

- `vite.config.js` sets Vite `server.port` to `5174`

## 2. Shared Infrastructure

Shared components:

- Input mode switcher: `src/Components/Common/InputSystem/GenericInputMethodSelector.jsx`
- Modal: `src/Components/Common/Modal.jsx`
- Conversion modal: `src/Components/Common/ConversionModal.jsx`
- Info popover: `src/Components/Common/InfoButton.jsx`
- Import/export controls: `src/Components/Common/FileTransferControls.jsx`
- Error boundary and fallback: `src/Components/Common/ErrorBoundary.jsx`, `src/Components/Common/ErrorPage.jsx`
- Graph lock toggle: `src/Components/Common/GraphControls/GraphLockButton.jsx`

Shared hooks:

- Graph rendering constants: `src/Hooks/useGraphSettings.js`
- Graph colors from CSS variables: `src/Hooks/useGraphColors.js`

Cross-cutting UI pattern:

- Every domain computes analysis once and replays it by step index in a modal.

## 3. Data Formats (JSON)

### 3.1 MCVP (`Sady/MCVP/*.json`)

Minimal prepared-set format:

```json
{
  "name": "...",
  "nodes": [
    { "id": 1, "type": "variable", "value": "x1", "varValue": 0 },
    { "id": 2, "type": "operation", "value": "A" }
  ],
  "edges": [{ "source": 2, "target": 1 }]
}
```

Import also accepts:

- `links` instead of `edges`
- optional `positions` object (`{ "nodeId": { "x": number, "y": number } }`)
- optional per-node `x`/`y`

### 3.2 Combinatorial Game (`Sady/CombinatorialGame/*.json`)

Flat format:

```json
{
  "name": "...",
  "nodes": [{ "id": "1", "player": 1 }],
  "edges": [{ "source": "1", "target": "2" }],
  "startingPosition": "1"
}
```

Runtime internal format (manual editor / analysis):

```json
{
  "positions": {
    "1": { "id": "1", "player": 1, "children": ["2"], "parents": [] }
  },
  "startingPosition": { "id": "1" }
}
```

Optional export layout field in flat format:

- `nodePositions` (`{ "id": { "x": number, "y": number } }`)

### 3.3 Grammar (`Sady/Grammar/*.json`)

```json
{
  "name": "...",
  "nonTerminals": ["S", "E"],
  "terminals": ["+", "id"],
  "productions": {
    "S": [["E"]],
    "E": [["E", "+", "id"], ["id"]]
  }
}
```

Import also accepts an array of grammars and loads the first one.

## 4. MCVP (Monotone Circuit Value Problem)

Module root:

- `src/Components/MCVP/MCVP.jsx`

### 4.1 Input modes

- Manual text parser: `InputSelectionComponents/ManualInput.jsx`
- Random generator: `InputSelectionComponents/GenerateInput.jsx`
- Prepared sets loader: `InputSelectionComponents/PreparedSetsInput.jsx`
- Interactive graph editor:
  - `InputSelectionComponents/Interactive/InteractiveInput.jsx`
  - `InteractiveInput.helpers.js`
  - `InteractiveInput.renderers.js`
  - `InteractiveSelectedNodeControls.jsx`

### 4.2 Core models and transformations

- Node class: `Utils/NodeClass.js`
- Parser: `Utils/Parser.js` (`parseExpressionToTree`)
- Generator: `Utils/Generator.js` (`generateTree`)
- Graph normalization/validation: `Utils/GraphToTree.js` (`graphToTree`)
- Import/export conversion: `Utils/Serialization.js` (`flatGraphToTree`, `treeToFlatGraph`)

### 4.3 Evaluation algorithm

- File: `Utils/EvaluateCircuit.js`
- Entry: `evaluateCircuitWithSteps(root)`
- Behavior:
  - DFS evaluation with memoization (`memo` map)
  - cycle detection using active recursion path (`visiting` set)
  - collects per-node evaluation steps
  - appends final summary step with `type: 'FINAL'`
- Return: `{ result, steps }`
- Complexity: approximately `O(V + E)` on the reachable DAG

### 4.4 Important constraints

- Parser variable consistency: same variable cannot appear with conflicting value (`x1[1]` and `x1[0]` is invalid).
- Generator feasibility: for binary structure, `numGates >= numVariables - 1`.
- Interactive operation nodes can have at most 2 outgoing edges.
- Manual and generated input clamp to 750 nodes-like limits in UI.

### 4.5 Visualization specifics

- Main graph renderer: `TreeRenderCanvas.jsx`
- Uses `react-force-graph-2d` and optional DAG top-down mode (`dagMode='td'`).
- Keeps model and canvas aligned by persisting `x/y` back to source nodes.
- Shows reversed visual arrowheads via `Utils/drawReversedArrowhead.js` while keeping logical edge relation parent -> child.

### 4.6 Import/export behavior

- Export from `MCVP.jsx` can include live positions captured from active graph engine snapshot.
- Import accepts legacy object-with-sets shape (uses first valid set).
- Imported graphs with positions are auto-locked on first render for stable layout.

### 4.7 Interactive behavior notes

- Background click clears active node selection.
- In edge-adding mode, background click cancels the mode unless fallback hit-testing detects a node target.
- Canvas-picking fallback uses pointer-to-graph geometric hit-testing to mitigate browser color-picking quirks.
- Engine-stop position sync is gated by pending-layout state and a small coordinate tolerance to reduce periodic twitch/resync loops.

## 5. Combinatorial Game

Module root:

- `src/Components/CombinatorialGame/CombinatorialGame.jsx`

### 5.1 Input modes

- Manual visual editor:
  - `InputSelectionComponents/ManualInput/ManualInput.jsx`
  - `ManualInput.helpers.js`
  - `ManualInput.renderers.js`
  - `ManualInputPanels.jsx`
- Random generator: `InputSelectionComponents/GenerateInput.jsx`
- Prepared sets: `InputSelectionComponents/PreparedSetsInput.jsx`

### 5.2 Core algorithms

- File: `Utils/ComputeWinner.js`
- Entries:
  - `computeWinner(graph)`
  - `getOptimalMoves(graph, precomputedResult)`

Winner computation details:

- queue-based retrograde propagation (iterative, not recursive DFS)
- initial terminal nodes marked `LOSE` relative to player-to-move at that node
- parent updates consider whether move changes active player (uses `samePlayer` branch logic)
- unresolved positions remain `DRAW`
- final result converted to Player 1 perspective from start position
- step list includes terminal, update, and final summary entries

Complexity:

- approximately `O(V + E)`

### 5.3 Generator and graph model

- Generator: `Utils/Generator.js` (`generateGraph`)
  - creates positions `0..n-1`
  - builds guaranteed reachability backbone from node `0`
  - adds random extra edges (cycles possible)
- Models: `Utils/NodeClasses.js` (`GamePosition`, `GameGraph`)

### 5.4 Rendering and replay

- Graph renderer: `Utils/DisplayGraph.jsx`
  - highlights start node
  - highlights optimal Player 1 edges in gold
  - can track highlighted step node
  - persists dragged coordinates back to `graph.positions`
- Result card: `Utils/GameAnalysisDisplay.jsx`
- Step replay modal: `StepByStepGame.jsx`

### 5.5 Export/import behavior

- Export supports both internal (`positions`) and flat (`nodes/edges`) state.
- Flat export may include `nodePositions` (if coordinates exist).
- Import accepts flat or internal graph and also legacy collection objects (first valid set used).

## 6. Grammar

Module root:

- `src/Components/Grammar/Grammar.jsx`

### 6.1 Input modes

- Manual text parser: `InputSelectionComponent/ManualInput.jsx`
- Generator: `InputSelectionComponent/GenerateInput.jsx`
- Prepared sets: `InputSelectionComponent/PreparedSetsInput.jsx`

### 6.2 Core model and parser

- Model: `Utils/Grammar.js` (`Grammar` class)
- Parser: `Utils/GrammarParser.js` (`parseGrammar(text)`)

Parser supports:

- both `->` and `→`
- alternatives with `|`
- epsilon as `ε` or `epsilon`
- non-terminals starting with uppercase letter (including Czech uppercase letters)

### 6.3 Generator

- File: `Utils/GrammarGenerator.js`
- Entry: `generateGrammar(config)`
- Key behavior:
  - generates non-terminals (`S`, then A..)
  - generates terminals (`a..`)
  - probabilistic recursion insertion (left/right/central)
  - optional epsilon creation (`never`, `random`, `always`)
  - post-process reachability so all non-terminals are reachable from start

UI complexity guard (`InputSelectionComponent/GenerateInput.jsx`):

- estimate uses rule count, rule length, recursion multiplier
- warning at `>= 240`
- hard block at `>= 420`

### 6.4 Emptiness evaluation and witness

- File: `Utils/GrammarEvaluator.js`
- Entry: `isEmptyLanguage(grammar)`
- Returns:
  - emptiness boolean
  - productive and nonproductive sets
  - explanation
  - optional derivation witness tree and derived word

Witness builder guardrails:

- iterative construction (no deep recursion)
- max nodes: 1200
- max depth: 80
- max symbol repeats per path: 4
- truncation metadata surfaced to UI (`witnessTruncated`, `witnessTruncationReason`)

### 6.5 Step-by-step analysis UI

- Step generator: `Utils/GrammarStepEvaluator.js` (`generateGrammarSteps`)
- Replay component: `StepByStepGrammar.jsx`
- Tree visualization: `DerivationTreeVisual.jsx`

## 7. Conversions

### 7.1 MCVP -> Combinatorial Game

Files:

- logic: `src/Components/Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame.js`
- UI: `src/Components/Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter.jsx`

Mapping rules:

- OR -> Player 1 position
- AND -> Player 2 position
- variable value `1` -> Player 2 terminal position
- variable value `0` -> Player 1 terminal position

Implementation notes:

- step generator class `MCVPToGameStepGenerator`
- per-node labels `V0`, `V1`, ...
- visited set prevents duplicate conversion of shared DAG nodes
- preserves source node `x/y` when available

### 7.2 MCVP -> Grammar

Files:

- helper grammar class: `src/Components/Conversions/MCVP-Grammar/ConversionGrammar.js`
- conversion logic + UI: `src/Components/Conversions/MCVP-Grammar/MCVPtoGrammarConverter.jsx`

Mapping rules:

- operation nodes receive non-terminals (`S` reserved for root)
- AND -> one concatenation production
- OR -> multiple alternative productions
- variable value `1` -> terminal, or epsilon with probability (`0.15`)
- variable value `0` -> self-loop `X -> X` (non-productive)

Implementation notes:

- symbol allocators:
  - `NonTerminalGenerator` (A..Z, then AA..)
  - `TerminalGenerator` (a..z, then symbols, then `t1`, ...)
- conversion runs in two phases: symbol assignment then production creation

## 8. Important Cross-Cutting Guardrails

- Graph layout persistence is deliberate:
  - MCVP and CG renderers write final/dragged positions back to model objects.
- Locking strategy:
  - lock/unlock works by setting/clearing `fx/fy` and can auto-lock after first settled layout.
- Step-replay architecture:
  - compute analysis once, then only change index in step UI components.
- Error reporting:
  - parser/evaluator/generator failures are surfaced with `react-toastify` toasts.

## 9. Tests (What Is Verified)

Test files:

- MCVP: `tests/mcvp.test.js`, `tests/mcvp.completeness.test.js`
- Combinatorial Game: `tests/combinatorial-game.test.js`, `tests/combinatorial-game.completeness.test.js`
- Grammar: `tests/grammar.test.js`, `tests/grammar.completeness.test.js`

What tests primarily cover:

- parser validity and malformed-input handling
- core algorithm correctness (truth tables, retrograde statuses, emptiness)
- generator constraints
- selected edge/cycle behavior

## 10. Quick Maintenance Checklist

When changing algorithms or flow:

1. Update this cheat sheet section(s) and `ProjectOverview.md`.
2. Verify all referenced files/symbols still exist.
3. Run tests: `npm run test`.
4. Update the verification date and commit hash in this file.

Useful search commands:

- `rg "export function|export class|class |useMemo|compute|generate|parse" src`
- `rg "evaluateCircuitWithSteps|computeWinner|isEmptyLanguage|generateGrammarSteps" src`

Useful run command:

- `npm run dev` (local default: `http://localhost:5174/`)

## 11. Naming Note

`generateTree` in MCVP produces DAG-like structures (shared subgraphs), even though some UI texts still say "tree".
