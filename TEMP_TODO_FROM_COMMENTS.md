# Done

- [x] MCVP generator: investigate why it produces only trees instead of general DAGs and allow reusing node outputs.
- [x] MCVP prepared sets: add non-trivial DAG examples (not only trees).
- [x] MCVP core logic: operation node should have max 2 childe nodes.
- [x] MCVP generation of graph: we should aim for two children for one parent node if possible.
- [x] MCVP expression parser: fix conflict detection for same variable with different values in one expression and when one variable is mentioned more times, use the same variable and not new one.
- [x] MCVP edge visualization: reverse arrow direction to match value propagation flow.
- [x] MCVP -> Combinatorial Game conversion: in the Combinatorial Game make the node ids visible permanently like in the MCVP graph.
- [x] Grammar generator: verify whether number of alternatives per nonterminal (`|`) is hard-limited in code.
- [x] Grammar generator: if useful, add “max alternatives per nonterminal” as a configurable generation parameter.
- [x] Grammar input: accept keyboard syntax `->` as equivalent to arrow `→`.
- [x] MCVP explanation and conversion modals: the graph displayed in the modals doesnt have the same node positions as in the default display component - when user positions the nodes and they have saved position, this data should be passed to and used in the explaination and conversion modals.
- [x] Combinatorial Game explanation modal: preserve manual node positions from the main view when opening the step-by-step explanation.
- [x] Main combinatorial game view: show node classification (I/II/no number) directly in the main view, not only in explanation.

# Clered documentation to here

- [x] MCVP -> Combinatorial Game conversion: Use stored position values for CG graph so the new graph has the same layout
- [x] MCVP -> Grammar conversion: show the created terminal symbol above the MCVP variable node

# To do

- [x] Grammar analysis (example tree): replace deep recursive search with a robust constructive algorithm that finds a small finite derivation when language is non-empty, prefer shortest/simplest derivation to avoid huge example trees.
- [ ] Step-by-step winning strategy analysis: improve wording of per-step status message (e.g., “In this node, Player 1 has a winning strategy.”).
- [ ] MCVP -> Combinatorial Game conversion: the graph of MCVP is stuck in the left upper corner and dragging (moving nodes or the whole graph) doesnt work, after like 10 seconds the graph centers, the zoom to fit function is porbably called.
- [x] Manual combinatorial game editor: fix unwanted graph scaling/spacing drift after pressing “Change player”.
- [ ] Grammar input: Go over all error messages and make sure they are easy to understand and explain the error correctly
- [ ] MCVP all display components: prevent node overlaps.
- [ ] Combinatory Game display component: Check if we can add viewport as a boundary for nodes, so they dont ecape - only for not connected ones.
- [ ] MCVP node structure: enforce binary arity for conjunction/disjunction so each such node has exactly 2 children.
- [ ] Check the whole project for dead or redundant code
