/**
 * Determines if Player I has a winning strategy from a given position.
 * Player I wins when Player II has no moves available on their turn.
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @returns {Object} - Result with winner information
 */
export function computeWinner(graph) {
  if (!graph || !graph.positions || !graph.startingPosition) {
    return { hasWinningStrategy: false, error: "Invalid graph data" };
  }

  // Map to store computed results (memoization)
  const memo = {};
  
  // Returns true if the player at position has a winning strategy
  function hasWinningStrategy(positionId) {
    // If already computed, return the result
    if (memo[positionId] !== undefined) {
      return memo[positionId];
    }
    
    // Temporarily mark as losing to handle cycles (assume losing first)
    memo[positionId] = false;
    
    const position = graph.positions[positionId];
    if (!position) {
      return false;
    }
    
    // Check if it's Player 2's turn and they have no moves - Player 1 wins
    if (position.player === 2 && (!position.children || position.children.length === 0)) {
      memo[positionId] = true;
      return true;
    }
    
    // If it's Player 1's turn, they need at least one move that leads to a winning position
    if (position.player === 1) {
      if (!position.children || position.children.length === 0) {
        memo[positionId] = false;
        return false;
      }
      
      for (const childId of position.children) {
        if (hasWinningStrategy(childId)) {
          memo[positionId] = true;
          return true;
        }
      }
    }
    
    // If it's Player 2's turn, all of their moves must lead to winning positions for Player 1
    if (position.player === 2) {
      if (!position.children || position.children.length === 0) {
        // Terminal position - Player 2 can't move, so Player 1 wins
        memo[positionId] = true;
        return true;
      }
      
      let allWinning = true;
      for (const childId of position.children) {
        if (!hasWinningStrategy(childId)) {
          allWinning = false;
          break;
        }
      }
      
      memo[positionId] = allWinning;
      return allWinning;
    }
    
    memo[positionId] = false;
    return false;
  }
  
  // Compute for the starting position
  const playerIWins = hasWinningStrategy(graph.startingPosition.id);
  
  return {
    hasWinningStrategy: playerIWins,
    winningPositions: memo,
    message: playerIWins 
      ? "Player I has a winning strategy"
      : "Player I does not have a winning strategy"
  };
}

/**
 * Finds and returns optimal moves for Player 1's winning strategy
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @returns {Object} - Map of position IDs to optimal next move IDs
 */
export function getOptimalMoves(graph) {
  if (!graph || !graph.positions) {
    return {};
  }
  
  // First compute winning positions
  const result = computeWinner(graph);
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