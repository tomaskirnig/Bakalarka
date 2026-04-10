# Project Cheat Sheet

Last verified: 2026-04-10
Commit: 974f086

Purpose: quick implementation reference for algorithms, data flow, and file locations.

## 1. Project map

Main app entry:

- `src/App.jsx`

Main pages:

- Home: `src/Components/HomePage.jsx`
- MCVP: `src/Components/MCVP/MCVP.jsx`
- Combinatorial Game: `src/Components/CombinatorialGame/CombinatorialGame.jsx`
- Grammar: `src/Components/Grammar/Grammar.jsx`

Navigation:

- `src/Components/Navigation.jsx`

## 2. Shared components and infrastructure

Shared UI/components:

- Generic input selector: `src/Components/Common/InputSystem/GenericInputMethodSelector.jsx`
- Conversion modal: `src/Components/Common/ConversionModal.jsx`
- File import/export controls: `src/Components/Common/FileTransferControls.jsx`
- Info modal/button: `src/Components/Common/InfoButton.jsx`
- Error boundary: `src/Components/Common/ErrorBoundary.jsx`

Visualization helpers/hooks:

- Graph lock control: `src/Components/Common/GraphControls/GraphLockButton.jsx`
- Graph settings/colors hooks: `src/Hooks/useGraphSettings.js`, `src/Hooks/useGraphColors.js`

## 3. Data formats (JSON)

MCVP set format (from `Sady/MCVP`):

```json
{
  "name": "...",
  "nodes": [{ "id": 1, "type": "variable|operation", "value": "x1|A|O", "varValue": 0 }],
  "edges": [{ "source": 6, "target": 4 }]
}
```

Combinatorial Game set format (from `Sady/CombinatorialGame`):

```json
{
  "name": "...",
  "nodes": [{ "id": "1", "player": 1 }],
  "edges": [{ "source": "1", "target": "2" }],
  "startingPosition": "1"
}
```

Grammar set format (from `Sady/Grammar`):

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

## 4. MCVP

Module root:

- `src/Components/MCVP/MCVP.jsx`

### 4.1 Manual input

Primary files:

- UI input: `src/Components/MCVP/InputSelectionComponents/ManualInput.jsx`
- Parser: `src/Components/MCVP/Utils/Parser.js`
- Node model: `src/Components/MCVP/Utils/NodeClass.js`

Algorithm: expression parsing pipeline

- What: tokenizes expression and builds DAG-like operation/variable node structure.
- Input: string like `((x1[1] A x2[0]) O x3[1])`.
- Output: root `Node` with `children`/`parents` links.
- Notes: operator precedence `OR` after `AND`; same variable name must keep same value.

### 4.2 Generated input

Primary files:

- UI input: `src/Components/MCVP/InputSelectionComponents/GenerateInput.jsx`
- Generator: `src/Components/MCVP/Utils/Generator.js`

Algorithm: random circuit generation

- What: creates random binary MCVP DAG and enforces one final root.
- Input: gate count, variable count.
- Output: generated root node.
- Constraints: binary arity for operation nodes; feasibility checks avoid invalid root counts.

### 4.3 Prepared sets input

Primary files:

- UI input: `src/Components/MCVP/InputSelectionComponents/PreparedSetsInput.jsx`
- Dataset folder: `Sady/MCVP`
- Serialization: `src/Components/MCVP/Utils/Serialization.js`

Data handling

- Loads predefined sets and converts between flat graph JSON and internal tree/DAG structure.

### 4.4 Core algorithms

Algorithm: circuit evaluation with tracked steps

- File: `src/Components/MCVP/Utils/EvaluateCircuit.js`
- What: DFS-based evaluation with memoization and cycle detection.
- Input: root node.
- Output: `{ result, steps }`.
- Complexity: O(n) over visited nodes (with memoization).

Algorithm: step-by-step playback

- Files: `src/Components/MCVP/StepByStepTree.jsx`, `src/Components/MCVP/MCVP.jsx`
- What: consumes precomputed `steps` and visualizes evaluation sequence.
- Related visualization: `src/Components/MCVP/TreeRenderCanvas.jsx`.

## 5. Combinatorial Game (CG)

Module root:

- `src/Components/CombinatorialGame/CombinatorialGame.jsx`

### 5.1 Manual input

Primary files:

- UI editor: `src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.jsx`
- Helpers/panels/renderers:
  - `src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.helpers.js`
  - `src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInput.renderers.js`
  - `src/Components/CombinatorialGame/InputSelectionComponents/ManualInput/ManualInputPanels.jsx`

Flow summary

- Interactive node/edge editing with start node assignment and player assignment per node.

### 5.2 Generated input

Primary files:

- UI input: `src/Components/CombinatorialGame/InputSelectionComponents/GenerateInput.jsx`
- Generator: `src/Components/CombinatorialGame/Utils/Generator.js`

Algorithm: random game graph generation

- What: builds connected graph from node 0, then adds random edges (can introduce cycles).
- Input: number of positions, edge probability.
- Output: `GameGraph` with `positions` and `startingPosition`.

### 5.3 Prepared sets input

Primary files:

- UI input: `src/Components/CombinatorialGame/InputSelectionComponents/PreparedSetsInput.jsx`
- Dataset folder: `Sady/CombinatorialGame`

Data handling

- Imports/exports flat graph JSON (`nodes`, `edges`, `startingPosition`) and optional stored positions.

### 5.4 Core algorithms

Algorithm: winner computation (retrograde analysis)

- File: `src/Components/CombinatorialGame/Utils/ComputeWinner.js`
- What: labels nodes `WIN/LOSE/DRAW` using queue propagation from terminal positions.
- Input: graph with `positions` and `startingPosition`.
- Output: strategy result, node statuses, explanation, and analysis `steps`.
- Complexity: approximately O(V + E).

Algorithm: optimal moves extraction

- File: `src/Components/CombinatorialGame/Utils/ComputeWinner.js`
- What: extracts winning edges for Player 1 from computed statuses.
- Output: `Set` of edge keys (`source-target`).

Algorithm: step-by-step analysis playback

- Files: `src/Components/CombinatorialGame/StepByStepGame.jsx`, `src/Components/CombinatorialGame/CombinatorialGame.jsx`
- Related visualization: `src/Components/CombinatorialGame/Utils/DisplayGraph.jsx`, `src/Components/CombinatorialGame/Utils/GameAnalysisDisplay.jsx`.

## 6. Grammar

Module root:

- `src/Components/Grammar/Grammar.jsx`

### 6.1 Manual input

Primary files:

- UI input: `src/Components/Grammar/InputSelectionComponent/ManualInput.jsx`
- Parser: `src/Components/Grammar/Utils/GrammarParser.js`
- Model: `src/Components/Grammar/Utils/Grammar.js`

Algorithm: grammar parsing and validation

- What: parses text rules, supports `->` and `→`, handles alternatives (`|`) and epsilon (`ε`/`epsilon`).
- Input: multiline rule text.
- Output: internal `Grammar` object.

### 6.2 Generated input

Primary files:

- UI input: `src/Components/Grammar/InputSelectionComponent/GenerateInput.jsx`
- Generator: `src/Components/Grammar/Utils/GrammarGenerator.js`

Algorithm: random CFG generation

- What: builds non-terminals, terminals, productions under config constraints.
- Input: generator config (counts, max length, recursion flags, epsilon mode, production bounds).
- Output: `Grammar` instance.
- Extras: includes reachability fix and epsilon guarantee mode.

### 6.3 Prepared sets input

Primary files:

- UI input: `src/Components/Grammar/InputSelectionComponent/PreparedSetsInput.jsx`
- Dataset folder: `Sady/Grammar`

Data handling

- Supports import of grammar object or array format, with required fields validation.

### 6.4 Core algorithms

Algorithm: empty language check and productive symbols

- File: `src/Components/Grammar/Utils/GrammarEvaluator.js`
- Function entry: `isEmptyLanguage(grammar)`.
- What: queue-based fixed-point search for productive non-terminals.
- Output: `{ isEmpty, productive, nonproductive, explanation, ... }`.
- Complexity: roughly O(|P| \* |N|).

Algorithm: derivation witness/tree construction

- File: `src/Components/Grammar/Utils/GrammarEvaluator.js`
- What: constructs compact finite witness derivation tree with safeguards.
- Guardrails: node/depth limits, cycle-avoidance heuristics, truncation metadata.

Algorithm: step-by-step grammar analysis UI

- Files: `src/Components/Grammar/StepByStepGrammar.jsx`, `src/Components/Grammar/Grammar.jsx`
- Related visualization: `src/Components/Grammar/DerivationTreeVisual.jsx`.

## 7. Conversions

### 7.1 MCVP -> Combinatorial Game

Primary files:

- Core conversion logic: `src/Components/Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame.js`
- Converter UI: `src/Components/Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter.jsx`

Algorithm summary

- OR node -> Player 1 position.
- AND node -> Player 2 position.
- Variable `1` -> Player 2 terminal position.
- Variable `0` -> Player 1 terminal position.
- Uses step generator (`MCVPToGameStepGenerator`) and visited-set to avoid duplication.

### 7.2 MCVP -> Grammar

Primary files:

- Core conversion and UI: `src/Components/Conversions/MCVP-Grammar/MCVPtoGrammarConverter.jsx`
- Grammar helper class: `src/Components/Conversions/MCVP-Grammar/ConversionGrammar.js`

Algorithm summary

- Assigns non-terminals to operation nodes (`S` for root).
- Maps variable `1` to terminal (or epsilon with probability).
- Maps variable `0` to non-productive loop rule (`X -> X`).
- Builds productions per gate type and records conversion steps for visualization.

## 8. Quick maintenance guide

When adding/changing algorithms:

1. Update this file in the relevant module section.
2. Keep each algorithm entry short: what, input/output, complexity, location.
3. Add/adjust related UI entry points if flow changed.
4. Verify listed file paths exist.
5. Update "Last verified" date and commit hash.

Recommended checks:

- `rg "export function|class|useMemo|compute|generate|parse" src/Components`
- `rg "MCVP|CombinatorialGame|Grammar|Conversion" src/Components`

## 9. Known naming note

MCVP generator function is named `generateTree` but it produces DAG-style structures with shared subgraphs when reused nodes are selected.
