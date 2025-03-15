// Holds info for a single position/node in the graph
export class GamePosition {
    constructor(id, player, parents, children, isWinning) {
      this.id = id; // Internal id
      this.player = player; // Player that makes the move from this position
      this.parents = parents; // List of parent positions
      this.children = children; // List of child positions
      this.isWinning = isWinning; // Is this position winning?
    }
  }
  
  // Holds all positions keyed by their IDs + the starting position
  export class GameGraph {
    constructor(positions, startingPosition) {
        this.positions = positions; // All positions in the graph
        this.startingPosition = startingPosition; // starting position
        }
  }
  