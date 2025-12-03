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
  const expanded = new Set();
  const stack = [graph.startingPosition.id];
  
  const getResult = (id) => memo[id] === undefined ? false : memo[id];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];

    if (memo[u] !== undefined && !processing.has(u)) {
      stack.pop();
      continue;
    }

    if (!expanded.has(u)) {
      processing.add(u);
      expanded.add(u);
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
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @param {Object<string, Object>} graph.positions - Map of position IDs to position objects
 * @param {Object} [precomputedResult] - Optional result from computeWinner to avoid re-calculation
 * @returns {Object} Map of position IDs to optimal next move IDs for Player 1
 */
export function getOptimalMoves(graph, precomputedResult = null) {
  if (!graph || !graph.positions) {
    return {};
  }
  
  // Use precomputed result if available, otherwise compute
  const result = precomputedResult || computeWinner(graph);
  const winningPositions = result.winningPositions;
  
  const optimalMoves = {};
  
  // Only calculate optimal moves for positions where Player 1 has a turn
  for (const posId in graph.positions) {
    const position = graph.positions[posId];
    
    // Only consider positions where it's Player 1's turn and they have a winning strategy
    if (position.player === 1 && winningPositions[posId]) {
      for (const childId of position.children || []) {
        // A move is optimal if it leads to a position where Player 1 still has a winning strategy
        if (winningPositions[childId]) {
          optimalMoves[posId] = childId;
          break; // We only need one optimal move
        }
      }
    }
  }
  
  return optimalMoves;
}