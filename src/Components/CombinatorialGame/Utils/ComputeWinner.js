/**
 * @fileoverview Provides functions to analyze combinatorial games and determine winning strategies.
 */

/**
 * Determines if Player I has a winning strategy from a given position.
 * Uses an iterative algorithm to handle cycles and determine WIN/LOSE/DRAW status.
 * 
 * @param {Object} graph - The game graph with positions and startingPosition
 * @param {Object<string, Object>} graph.positions - Map of position IDs to position objects
 * @param {Object} graph.startingPosition - The starting position of the game
 * @returns {Object} Result with winner information, containing:
 *   - hasWinningStrategy: boolean indicating if Player I can win (status === 'WIN')
 *   - winningPositions: map of positions with their status ('WIN', 'LOSE', 'DRAW')
 *   - message: human-readable result message
 *   - error: error message if analysis failed
 *   - steps: Array of analysis steps for visualization
 */
export function computeWinner(graph) {
  if (!graph || !graph.positions || !graph.startingPosition) {
    return { hasWinningStrategy: false, error: "Invalid graph data" };
  }

  const positionIds = Object.keys(graph.positions);
  const nodeStatus = {}; // 'WIN', 'LOSE', 'DRAW' relative to the player AT THE NODE
  const degree = {}; // Number of children that are not yet decisive for the current player
  const steps = [];

  // Initialize
  positionIds.forEach(id => {
    nodeStatus[id] = 'DRAW'; // Default assumption
    const pos = graph.positions[id];
    degree[id] = pos.children ? pos.children.length : 0;
  });

  const queue = [];

  // 1. Identify terminal nodes
  positionIds.forEach(id => {
    if (degree[id] === 0) {
      nodeStatus[id] = 'LOSE';
      queue.push(id);
      const player = graph.positions[id].player;
      const explanation = player === 1 
        ? `Pozice ${id} je koncová (bez tahů). Hráč 1 zde prohrává.`
        : `Pozice ${id} je koncová (bez tahů). Hráč 1 zde vyhrává (soupeř nemá tah).`;
      steps.push({
        type: 'TERMINAL',
        id: id,
        status: 'LOSE',
        explanation
      });
    }
  });

  // 2. Iterative processing (Retrograde Analysis)
  while (queue.length > 0) {
    const u = queue.shift();
    const statusU = nodeStatus[u];

    const parents = graph.positions[u].parents || [];
    for (const p of parents) {
      if (nodeStatus[p] !== 'DRAW') continue;

      const parentPos = graph.positions[p];
      const playerP = parentPos.player;
      const playerU = graph.positions[u].player;
      const samePlayer = (playerP === playerU);

      if (statusU === 'LOSE') {
        if (!samePlayer) {
          nodeStatus[p] = 'WIN';
          queue.push(p);
          const p1perspective = playerP === 1 
            ? `Hráč 1 vyhrává z pozice ${p} (lze táhnout do prohrávající pozice soupeře ${u}).`
            : `Hráč 1 prohrává z pozice ${p} (soupeř může táhnout do prohrávající pozice Hráče 1 ${u}).`;
          steps.push({
            type: 'UPDATE',
            id: p,
            status: 'WIN',
            triggerId: u,
            explanation: p1perspective
          });
        } else {
          degree[p]--;
          if (degree[p] === 0) {
            nodeStatus[p] = 'LOSE';
            queue.push(p);
            const p1perspective = playerP === 1
              ? `Hráč 1 prohrává z pozice ${p} (všechny tahy vedou do prohrávajících pozic).`
              : `Hráč 1 vyhrává z pozice ${p} (soupeř nemá vyhrávající tah).`;
            steps.push({
              type: 'UPDATE',
              id: p,
              status: 'LOSE',
              triggerId: u,
              explanation: p1perspective
            });
          }
        }
      } else if (statusU === 'WIN') {
        if (samePlayer) {
          nodeStatus[p] = 'WIN';
          queue.push(p);
          const p1perspective = playerP === 1
            ? `Hráč 1 vyhrává z pozice ${p} (lze táhnout do své vyhrávající pozice ${u}).`
            : `Hráč 1 prohrává z pozice ${p} (soupeř může táhnout do své vyhrávající pozice ${u}).`;
          steps.push({
            type: 'UPDATE',
            id: p,
            status: 'WIN',
            triggerId: u,
            explanation: p1perspective
          });
        } else {
          degree[p]--;
          if (degree[p] === 0) {
            nodeStatus[p] = 'LOSE';
            queue.push(p);
            const p1perspective = playerP === 1
              ? `Hráč 1 prohrává z pozice ${p} (všechny tahy vedou do vyhrávajících pozic soupeře).`
              : `Hráč 1 vyhrává z pozice ${p} (všechny tahy soupeře vedou do vítězných pozic Hráče 1).`;
            steps.push({
              type: 'UPDATE',
              id: p,
              status: 'LOSE',
              triggerId: u,
              explanation: p1perspective
            });
          }
        }
      }
    }
  }

  // 3. Determine result for Player 1 at starting position
  const startId = graph.startingPosition.id;
  const startStatus = nodeStatus[startId];
  const startPlayer = graph.positions[startId].player;

  let hasWinningStrategy = false;
  let message = "";

  if (startStatus === 'DRAW') {
    hasWinningStrategy = false;
    message = "Hráč 1 nemá výherní strategii. Hra končí remízou.";
  } else {
    if (startPlayer === 1) {
      if (startStatus === 'WIN') {
        hasWinningStrategy = true;
        message = "Hráč 1 má výherní strategii.";
      } else {
        hasWinningStrategy = false;
        message = "Hráč 1 nemá výherní strategii. Hráč 2 vyhrává.";
      }
    } else { // startPlayer === 2
      if (startStatus === 'WIN') {
        hasWinningStrategy = false;
        message = "Hráč 1 nemá výherní strategii. Hráč 2 vyhrává.";
      } else {
        hasWinningStrategy = true;
        message = "Hráč 1 má výherní strategii (Hráč 2 začíná v prohrávající pozici).";
      }
    }
  }

  // Add final summary step
  steps.push({
    type: 'FINAL',
    id: startId,
    hasWinningStrategy,
    explanation: `Analýza dokončena. Výsledek z počáteční pozice ${startId}: ${message}`
  });

  const finalNodeStatus = {};
  positionIds.forEach(id => {
    const s = nodeStatus[id];
    const p = graph.positions[id].player;
    
    if (s === 'DRAW') {
      finalNodeStatus[id] = 0;
    } else if (s === 'WIN') {
      finalNodeStatus[id] = p;
    } else {
      finalNodeStatus[id] = p === 1 ? 2 : 1;
    }
  });

  return {
    hasWinningStrategy,
    winningPositions: finalNodeStatus,
    nodeStatusRaw: nodeStatus,
    message,
    steps
  };
}

/**
 * Finds and returns optimal moves for Player 1's winning strategy.
 * 
 * @param {Object} graph - The game graph
 * @param {Object} [precomputedResult] - Result from computeWinner
 * @returns {Set<string>} Set of optimal edge keys "sourceId-targetId"
 */
export function getOptimalMoves(graph, precomputedResult = null) {
  if (!graph || !graph.positions) {
    return new Set();
  }
  
  const result = precomputedResult || computeWinner(graph);
  const status = result.winningPositions;
  const optimalEdges = new Set();
  
  for (const posId in graph.positions) {
    const position = graph.positions[posId];
    
    if (position.player === 1 && status[posId] === 1) {
      for (const childId of position.children || []) {
        if (status[childId] === 1) {
          optimalEdges.add(`${posId}-${childId}`);
        }
      }
    }
  }
  
  return optimalEdges;
}
