# Project Overview & Architectural Guide

Last verified: 2026-04-27  
Commit baseline: 2c60481 (working tree changes applied)

This document is the implementation-level map of the project. It details the technical logic, core algorithms, and data contracts used to solve theoretical informatics problems.

---

## 1. Core Architectural Pillars

### Pattern A: "Compute Once, Replay by Index" (Explanations)
Walkthroughs (e.g., `StepByStepTree`) do not re-run algorithms on every click. 
- **The Flow:** When a graph/grammar is loaded, a "Step Evaluator" runs once. It produces an array of `step` objects.
- **The Data:** Each `step` object contains a snapshot of what changed (e.g., `nodeId: "5", newValue: 1`).
- **The UI:** The UI component simply maintains a `currentIndex`. Renders show the model state up to that index. This ensures the UI remains snappy even with thousands of nodes.

### Pattern B: "Visual Persistence" (D3 <-> React Sync)
The app uses `react-force-graph-2d` (D3). D3 mutates `x, y` coordinates outside React's state for performance.
- **The Problem:** If you re-render the page, D3 restarts the simulation, and your nodes "jump".
- **The Solution:** 
  1. **Syncing:** On `onNodeDragEnd`, coordinates are written directly into the source data objects.
  2. **Snapshotting:** During Export, a `positionSnapshotGetter` pulls the exact pixel coordinates from the D3 engine.
  3. **Locking:** We use `fx/fy` properties. When a node has `fx`, D3 treats it as "pinned".

---

## 2. MCVP (Monotone Circuit Value Problem)

### Logical Data Flow
`Expression String` → `Parser (Recursive Descent)` → `Recursive DAG (Nodes/Children)` → `DFS Evaluator` → `Result State`

### Internal Model: Recursive DAG
Unlike a simple tree, nodes in MCVP are shared. If `x1` is used in three gates, all three point to the **same object memory reference**. This is why we call it a **Directed Acyclic Graph (DAG)**.

### Core Algorithm: DFS with Memoization
- **File:** `src/Components/MCVP/Utils/EvaluateCircuit.js`
- **Logic:** 
  1. **Base Case:** If node is a variable, return its value (0 or 1).
  2. **Memo Check:** If we already computed this node's value, return it immediately.
  3. **Recursive Step:**
     - For **AND**: Evaluate children. Result is `1` only if *both* are `1`.
     - For **OR**: Evaluate children. Result is `1` if *at least one* is `1`.
  4. **Cycle Guard:** We maintain a `visiting` set. if we hit a node already in the current recursion stack, the circuit is invalid (contains a cycle).

---

## 3. Combinatorial Games on Graphs

### Logical Data Flow
`Manual/Generated Graph` → `Adjacency Map (positions)` → `Retrograde Analysis` → `Winning/Losing Statuses`

### Internal Model: Adjacency Map
To allow $O(1)$ lookup, the graph is stored as an object where keys are IDs:
```json
{ "pos5": { "id": "5", "player": 1, "children": ["pos2", "pos8"], "parents": ["pos1"] } }
```

### Core Algorithm: Retrograde Analysis (Queue-based)
This algorithm solves the game by working backward from the end (terminal positions).
- **File:** `src/Components/CombinatorialGame/Utils/ComputeWinner.js`
- **Steps:**
  1. **Seed:** Find all nodes with 0 outgoing edges. These are **LOSE** for the player at that node.
  2. **Propagate:** Put them in a queue. For each node `u` popped:
     - Check its **Parents** (nodes that can move to `u`).
     - If a parent can move to a **LOSE** node, that parent is **WIN**.
     - If a parent's *every* possible move leads to a **WIN** node, that parent is **LOSE**.
  3. **Cycles:** Any node that never gets resolved by this backward propagation is a **DRAW** (you can play forever).

---

## 4. Grammar Emptiness Problem

### Logical Data Flow
`Grammar Text` → `Parser` → `Productive Set (Fixed-point)` → `Heuristic Tree Builder` → `Witness Word`

### Core Algorithm 1: Fixed-Point Iteration (Emptiness)
Determines if the grammar generates *anything* at all.
- **Logic:**
  1. Initialize `ProductiveSet` with all **Terminals**.
  2. **Loop:** Scan every production (e.g., `A → B c`). 
  3. If *every* symbol on the right-hand side (`B` and `c`) is already in the `ProductiveSet`, then the left-hand side (`A`) becomes **Productive**.
  4. Repeat until no more non-terminals can be added.
  5. **Result:** If the **Start Symbol** is in the set, the language is non-empty.

### Core Algorithm 2: Heuristic Witness Construction
If the language is non-empty, we need to show a "witness" (a derivation tree).
- **The Challenge:** A grammar can have infinite derivations.
- **The Solution:** We track the "cost" (shortest path) to terminals for every non-terminal during the emptiness check. The tree builder always picks the production with the **lowest cost** to guarantee a finite, small tree.

---

## 5. Data Contracts & Standardization

### JSON Position Key: `nodePositions`
To keep import/export consistent across all graph-based modules:
- **Standard:** `{ "nodes": [...], "links": [...], "nodePositions": { "id": { "x": 0, "y": 0 } } }`.
- **Logic:** The `handleImport` functions in `MCVP.jsx` and `CombinatorialGame.jsx` are designed to detect both the new `nodePositions` and the legacy `positions` key to ensure old files still work.

### Validity Gating
The UI uses "Analysis Gating". Buttons like "Explain" or "Convert" only become active when the current structure passes validation:
- **MCVP:** Must have exactly one root and no cycles.
- **Game:** Must have a designated starting position.
- **Grammar:** All non-terminals used must be defined.

---

## 6. Maintenance & Testing
- **Algorithms:** Always verify logic changes in `tests/*.test.js` using `npm run test`.
- **Visuals:** If a new graph renderer is added, it MUST implement Pattern B (coordinate persistence) to feel consistent with the rest of the app.
