/**
 * @fileoverview Provides functions to analyze combinatorial games and determine winning strategies.
 */

/**
 * Determines if Player I has a winning strategy from a given position.
 * Player I wins when Player II has no moves available on their turn.
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @param {Object<string, Object>} graph.positions - Map of position IDs to position objects
 * @param {Object} graph.startingPosition - The starting position of the game
 * @returns {Object} Result with winner information, containing:
 *   - hasWinningStrategy: boolean indicating if Player I can win
 *   - winningPositions: map of positions with their winning status
 *   - message: human-readable result message
 *   - error: error message if analysis failed
 */
export function computeWinner(graph) {
  if (!graph || !graph.positions || !graph.startingPosition) {
    return { hasWinningStrategy: false, error: "Invalid graph data" };
  }

  const memo = {};
  const processing = new Set();
  const visited = new Set();
  const stack = [graph.startingPosition.id];
  
  const getResult = (id) => memo[id] === undefined ? false : memo[id];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];

    if (memo[u] !== undefined && !processing.has(u)) {
      stack.pop();
      continue;
    }

    if (!visited.has(u)) {
      processing.add(u);
      visited.add(u);
      memo[u] = false; // Default/Cycle assumption

      const position = graph.positions[u];
      if (position && position.children) {
        for (const v of position.children) {
           if (!processing.has(v) && memo[v] === undefined) {
             stack.push(v);
           }
        }
      }
    } else {
      const position = graph.positions[u];
      let result = false;
      
      if (!position) {
         result = false;
      } else if (position.player === 2 && (!position.children || position.children.length === 0)) {
         result = true;
      } else if (position.player === 1) {
         if (position.children && position.children.length > 0) {
           for (const childId of position.children) {
             if (getResult(childId)) {
               result = true;
               break;
             }
           }
         }
      } else if (position.player === 2) {
         if (!position.children || position.children.length === 0) {
            result = true; 
         } else {
            result = true;
            for (const childId of position.children) {
              if (!getResult(childId)) {
                result = false;
                break;
              }
            }
         }
      }

      memo[u] = result;
      processing.delete(u);
      stack.pop();
    }
  }
  
  const playerIWins = getResult(graph.startingPosition.id);
  
  return {
    hasWinningStrategy: playerIWins,
    winningPositions: memo,
    message: playerIWins 
      ? "Hráč I má výherní strategii"
      : "Hráč I nemá výherní strategii",
  };
}

/**
 * Finds and returns optimal moves for Player 1's winning strategy.
 * Includes all moves that preserve the winning state (Winning -> Winning).
 * This covers Player 1's optimal choices and Player 2's forced moves (if any).
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @param {Object<string, Object>} graph.positions - Map of position IDs to position objects
 * @param {Object} [precomputedResult] - Optional result from computeWinner to avoid re-calculation
 * @returns {Set<string>} Set of optimal edge keys in format "sourceId-targetId"
 */
export function getOptimalMoves(graph, precomputedResult = null) {
  if (!graph || !graph.positions) {
    return new Set();
  }
  
  // Use precomputed result if available, otherwise compute
  const result = precomputedResult || computeWinner(graph);
  const winningPositions = result.winningPositions;
  
  const optimalEdges = new Set();
  
  for (const posId in graph.positions) {
    const position = graph.positions[posId];
    
    // Check edges u -> v
    // We only highlight edges starting from a Winning position for P1.
    // If u is winning for P1, then a move is "optimal" (or part of the winning strategy)
    // if it leads to a state v that is ALSO winning for P1.
    if (winningPositions[posId]) {
      for (const childId of position.children || []) {
        if (winningPositions[childId]) {
          optimalEdges.add(`${posId}-${childId}`);
        }
      }
    }
  }
  
  return optimalEdges;
}