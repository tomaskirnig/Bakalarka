# Project Overview

This document provides a detailed overview of the JavaScript (`.js`) and React Component (`.jsx`) files within the `src` directory of the project. It describes the purpose, algorithms, and key functions of each file to facilitate easier navigation and understanding of the codebase.

## Root Files

### 📄 App.jsx (src)
**Description:** The main application component that acts as the root of the React component tree. It manages the global state for the current page navigation and page data.
**Key Functions:**
- `App()`: Renders the `Navigation` and the active page component (`HomePage`, `MCVP`, `CombinatorialGame`, `Grammar`) based on `currentPage`. It also includes the `ToastContainer` for notifications.
- `handleNavSelection(option, data)`: Updates the `currentPage` and `pageData` state when navigation occurs.

### 📄 main.jsx (src)
**Description:** The entry point of the React application.
**Key Functions:**
- Renders the `App` component into the DOM root element.
- Imports global styles and Bootstrap JS.

## Hooks

### 📄 useGraphColors.js (src/Hooks)
**Description:** A custom hook that provides a centralized object of colors used in graph visualizations.
**Key Functions:**
- `useGraphColors()`: Fetches color values from CSS variables (e.g., `--color1`, `--color-accent-red`) and returns a reactive object containing specific color definitions for nodes, links, and UI elements.

### 📄 useGraphSettings.js (src/Hooks)
**Description:** A custom hook that centralizes configuration settings for graph visualizations.
**Key Functions:**
- `useGraphSettings()`: Returns a memoized object containing configuration parameters for MCVP and Game graphs (e.g., `nodeRadius`, `linkDistance`, `chargeStrength`).

## Components

### General Components

#### 📄 HomePage.jsx (src/Components)
**Description:** The landing page component.
**Key Functions:**
- `HomePage()`: Renders the `NetworkVisual` background and a welcome message.

#### 📄 Navigation.jsx (src/Components)
**Description:** The main navigation bar component.
**Key Functions:**
- `Navigation({ selectedOption, onNavSelect })`: Renders a responsive navbar with desktop and mobile (offcanvas) views. Handles navigation selection and mobile menu toggling.

### HPVisual

#### 📄 NodeVisual.jsx (src/Components/HPVisual)
**Description:** A component that renders an animated background visualization of moving nodes connected by edges.
**Algorithms:**
- **Particle System:** Simulates moving particles (nodes) that bounce off canvas boundaries.
- **Proximity connection:** Calculates Euclidean distance between all pairs of nodes in every frame (`O(N^2)`) and draws a line if they are within a certain `connectDistance`.
**Key Functions:**
- `NetworkVisual()`: Main component that sets up the canvas and animation loop.
- `Node` class: Represents a single particle with position, velocity, and drawing logic.
- `animate()`: The animation loop function that clears the canvas, updates node positions, and redraws elements.

### Common

#### 📄 Modal.jsx (src/Components/Common)
**Description:** A reusable modal dialog component.
**Key Functions:**
- `Modal({ onClose, children })`: Renders a modal overlay with a close button and the provided child content.

#### 📄 GenericInputMethodSelector.jsx (src/Components/Common/InputSystem)
**Description:** A generic component for switching between different input methods (e.g., Manual, Generate, Sets).
**Key Functions:**
- `GenericInputMethodSelector()`: Renders a set of radio buttons for options and a container for the selected input method's content.

### MCVP (Monotone Circuit Value Problem)

#### Core

##### 📄 MCVP.jsx (src/Components/MCVP)
**Description:** The main container component for the MCVP module. It orchestrates input selection, graph visualization (`TreeCanvas`), evaluation result display, and conversion options.
**Key Functions:**
- `MCVP({ onNavigate, initialData })`: Manages state for the current tree, evaluation results, and modal visibility. Integrates input components and the `TreeCanvas`.

##### 📄 TreeRenderCanvas.jsx (src/Components/MCVP)
**Description:** Visualizes the MCVP expression tree as a directed graph using `react-force-graph-2d`.
**Algorithms:**
- **Force-Directed Layout:** Uses D3 forces (link, charge, collision) to layout the graph.
- **DAG Layout:** Configured with `dagMode="td"` (top-down) for hierarchical tree visualization.
**Key Functions:**
- `TreeCanvas({ tree, highlightedNode, activeNode, completedSteps })`: Converts the tree structure into graph data (nodes/links), handles resizing, and defines custom painting functions (`paintNode`, `paintLink`) to draw nodes and edges with specific styles based on their state (evaluated, highlighted, etc.).

##### 📄 StepByStepTree.jsx (src/Components/MCVP)
**Description:** A component for visualizing the evaluation of an MCVP tree step-by-step.
**Key Functions:**
- `StepByStepTree({ tree })`: Uses `evaluateTreeWithSteps` to generate an evaluation sequence and provides controls ("Previous", "Next") to traverse these steps, updating the visualization via `TreeCanvas`.

#### Utils

##### 📄 EvaluateTree.js (src/Components/MCVP/Utils)
**Description:** Contains logic for evaluating MCVP expression trees.
**Algorithms:**
- **Recursive Evaluation (DFS):** Traverses the tree depth-first. Variable nodes return their value. Operation nodes (AND/OR) recursively evaluate children and apply logic.
**Key Functions:**
- `evaluateTree(node)`: Returns the final result (0 or 1) of the expression tree.
- `evaluateTreeWithSteps(node)`: Performs evaluation but records each step (node, children values, result) into an array for step-by-step visualization.

##### 📄 Generator.js (src/Components/MCVP/Utils)
**Description:** Generates random MCVP trees.
**Algorithms:**
- **Random Tree Generation:** Creates a pool of variable nodes, then iteratively combines them using random operator nodes (AND/OR) until one root remains.
**Key Functions:**
- `generateTree(numGates, numVariables)`: Generates a random tree with the specified number of gates and variables.

##### 📄 Parser.js (src/Components/MCVP/Utils)
**Description:** Parses string representations of MCVP expressions into tree structures.
**Algorithms:**
- **Recursive Descent Parser:** Tokenizes input and uses a standard recursive descent strategy to parse expressions with precedence (though MCVP is often simple parenthesized logic).
**Key Functions:**
- `tokenize(s)`: Lexical analysis, converts string to tokens (LPAREN, OPERATOR, VARIABLE, etc.).
- `Parser` class: Implements parsing logic (`parseExpression`, `parseOrExpr`, `parseAndExpr`, `parseFactor`).
- `parseExpressionToTree(exprStr)`: Main entry point that returns a `Node` tree.

##### 📄 NodeClass.js (src/Components/MCVP/Utils)
**Description:** Defines the data structure for tree nodes.
**Key Functions:**
- `Node` class: Represents a node with properties like `value`, `type` (variable/operation), `children`, `parents`, and `id`.

#### InputSelectionComponents

##### 📄 GenerateInput.jsx (src/Components/MCVP/InputSelectionComponents)
**Description:** Input form for generating random MCVP trees.
**Key Functions:**
- `GenerateInput()`: Captures user input for number of gates/variables and calls `generateTree`.

##### 📄 ManualInput.jsx (src/Components/MCVP/InputSelectionComponents)
**Description:** Input form for manually typing an MCVP expression string.
**Key Functions:**
- `ManualInput()`: Captures string input and calls `parseExpressionToTree`.

##### 📄 PreparedSetsInput.jsx (src/Components/MCVP/InputSelectionComponents)
**Description:** Dropdown selector for loading pre-defined MCVP examples from a JSON file.
**Key Functions:**
- `PreparedSetsInput()`: Loads data from `SadyMCVP.json` and parses the selected expression.

##### 📄 InteractiveInput.jsx (src/Components/MCVP/InputSelectionComponents)
**Description:** A complex interactive graph editor for building MCVP circuits visually.
**Key Functions:**
- `InteractiveMCVPGraph()`: Provides a force-graph canvas where users can add nodes, draw edges, change node types/values, and delete elements. It maintains the graph structure state and converts it to a tree format for evaluation.

### Combinatorial Game

#### Core

##### 📄 CombinatorialGame.jsx (src/Components/CombinatorialGame)
**Description:** The main container for the Combinatorial Game module.
**Key Functions:**
- `CombinatorialGame({ onNavigate, initialData })`: Manages state for the game graph and input method selection.

#### Utils

##### 📄 DisplayGraph.jsx (src/Components/CombinatorialGame/Utils)
**Description:** Visualizes the game graph and analysis results using `react-force-graph-2d`.
**Key Functions:**
- `DisplayGraph({ graph })`: Computes winning strategies using `computeWinner` and `getOptimalMoves`. Renders the graph, highlighting the starting position, players, and optimal moves (gold edges).

##### 📄 ComputeWinner.js (src/Components/CombinatorialGame/Utils)
**Description:** Analyzes the game graph to determine winning strategies (Game Theory).
**Algorithms:**
- **Minimax / Retrograde Analysis:** Determines if a position is winning or losing. A position is losing if there are no moves or all moves lead to winning positions for the opponent. A position is winning if there exists at least one move to a losing position for the opponent.
**Key Functions:**
- `computeWinner(graph)`: Determines if Player I has a winning strategy from the starting position using memoized DFS/recursion.
- `getOptimalMoves(graph)`: Returns a map of optimal moves for Player I.

##### 📄 Generator.js (src/Components/CombinatorialGame/Utils)
**Description:** Generates random game graphs.
**Key Functions:**
- `generateGraph(numGameFields, edgeProbability)`: Creates nodes with random player assignments and connects them ensuring a base path to guarantee connectivity, plus random extra edges.

##### 📄 Parser.js (src/Components/CombinatorialGame/Utils)
**Description:** Parses text representation of game graphs.
**Key Functions:**
- `parseExpressionToTree(expression, startingPosition)`: Parses a custom format string ("nodes: ...; edges: ...") into a graph object.

##### 📄 NodeClasses.js (src/Components/CombinatorialGame/Utils)
**Description:** Data structures for the game.
**Key Functions:**
- `GamePosition`: Represents a node in the game graph.
- `GameGraph`: Represents the entire game graph.

#### InputSelectionComponents

##### 📄 GenerateInput.jsx (src/Components/CombinatorialGame/InputSelectionComponents)
**Description:** Input form for generating random game graphs.
**Key Functions:**
- `GenerateInput()`: Inputs for number of fields and edge probability.

##### 📄 ManualInput.jsx (src/Components/CombinatorialGame/InputSelectionComponents)
**Description:** Interactive editor for manually creating game graphs.
**Key Functions:**
- `ManualInput()`: Similar to MCVP's interactive input, allows adding/removing nodes and edges, changing players, and visualizing analysis in real-time.

##### 📄 PreparedSetsInput.jsx (src/Components/CombinatorialGame/InputSelectionComponents)
**Description:** Selector for pre-defined game scenarios.
**Key Functions:**
- `PreparedSetsInput()`: Loads data from `SadyCG.json`.

### Grammar

#### Core

##### 📄 Grammar.jsx (src/Components/Grammar)
**Description:** Main container for the Grammar module.
**Key Functions:**
            </div>
        </div>
    </div>
    <div className="text-representation mt-3">
        <button
            className="btn btn-outline-secondary mb-2 w-100 text-start d-flex justify-content-between align-items-center"
            onClick={() => setShowText(!showText)}
            aria-expanded={showText}
        >
            <span>{showText ? 'Skrýt textový zápis' : 'Zobrazit textový zápis'}</span>
            <span>{showText ? '▲' : '▼'}</span>
        </button>

        {showText && (
            <div className="card card-body bg-light border-top-0 rounded-0 rounded-bottom">
                <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {grammar.toText ? grammar.toText() : JSON.stringify(grammar, null, 2)}
                </pre>
            </div>
        )}
    </div>
</div>


#### Utils

##### 📄 Grammar.js (src/Components/Grammar/Utils)
**Description:** Class definition for a Context-Free Grammar.
**Key Functions:**
- `Grammar` class: Stores non-terminals, terminals, and productions. Includes helper methods like `toText()`.

##### 📄 GrammarEvaluator.js (src/Components/Grammar/Utils)
**Description:** Analyzes properties of the grammar.
**Algorithms:**
- **Empty Language Test:** Iteratively computes the set of "productive" non-terminals (those that can derive a string of terminals). If the start symbol is not in this set, the language is empty.
**Key Functions:**
- `isEmptyLanguage(grammar)`: Returns whether the language generated by the grammar is empty and provides an explanation.

##### 📄 GrammarGenerator.js (src/Components/Grammar/Utils)
**Description:** Generates random context-free grammars.
**Algorithms:**
- **Random Grammar Generation:** Generates symbols and production rules based on constraints (left/right recursion, max length, epsilon rules).
**Key Functions:**
- `generateGrammar(config)`: Returns a new random `Grammar` instance.

##### 📄 GrammarParser.js (src/Components/Grammar/Utils)
**Description:** Parses text representation of grammar rules.
**Key Functions:**
- `parseGrammar(inputText)`: Parses strings like "S -> aS | b" into a `Grammar` object. Handles epsilon ('ε').

#### InputSelectionComponents

##### 📄 GenerateInput.jsx (src/Components/Grammar/InputSelectionComponent)
**Description:** Form for configuring and generating random grammars.
**Key Functions:**
- `GenerateInput()`: UI for setting counts of symbols, recursion options, etc.

##### 📄 ManualInput.jsx (src/Components/Grammar/InputSelectionComponent)
**Description:** Text area for manual grammar entry.
**Key Functions:**
- `ManualInput()`: Accepts raw text rules and uses `parseGrammar`.

##### 📄 PreparedSetsInput.jsx (src/Components/Grammar/InputSelectionComponent)
**Description:** Selector for pre-defined grammars.
**Key Functions:**
- `PreparedSetsInput()`: Loads data from `SadyG.json`.

### Conversions

#### MCVP to Combinatorial Game

##### 📄 ConversionCombinatorialGame.js (src/Components/Conversions/MCVP-CombinatorialGame)
**Description:** Logic for converting MCVP to a Combinatorial Game.
**Algorithms:**
- **Tree Traversal:** Maps MCVP nodes to Game positions: OR -> Player 1, AND -> Player 2, Variables -> Terminal positions (Winning/Losing based on value).
**Key Functions:**
- `convertMCVPtoGame(mcvpTree)`: Returns the final game graph.
- `MCVPToGameStepGenerator`: Generates a sequence of steps describing the conversion process for visualization.

##### 📄 MCVPtoCombinatorialGameConverter.jsx (src/Components/Conversions/MCVP-CombinatorialGame)
**Description:** UI component for visualizing the MCVP -> Game conversion.
**Key Functions:**
- `MCVPtoCombinatorialGameConverter()`: Displays side-by-side MCVP tree and Game graph, allowing step-by-step navigation through the conversion process.

#### MCVP to Grammar

##### 📄 ConversionGrammar.js (src/Components/Conversions/MCVP-Grammar)
**Description:** A subclass of `Grammar` tailored for conversion, adding methods to incrementally build the grammar.
**Key Functions:**
- `ConversionGrammar`: Extends `Grammar` with methods like `addProduction`.

##### 📄 ConversionGrammar.js (src/Components/Conversions/MCVP-Grammar) (Logic in MCVPtoGrammarConverter.jsx)
*Note: The core logic is largely embedded in the `MCVPToGrammarConverter` class within the JSX file below, but uses the class above.*

##### 📄 MCVPtoGrammarConverter.jsx (src/Components/Conversions/MCVP-Grammar)
**Description:** Logic and UI for converting MCVP to Context-Free Grammar.
**Algorithms:**
- **Recursive Mapping:** Traverses the MCVP tree. Assigns Non-Terminals to operation nodes. Creates productions: AND nodes -> Concatenation of child symbols; OR nodes -> Alternative productions for each child.
**Key Functions:**
- `MCVPToGrammarConverter` class: Handles the logic, mapping nodes to symbols and generating steps.
- `MCVPtoGrammarConverter()`: React component for step-by-step visualization of the conversion.
