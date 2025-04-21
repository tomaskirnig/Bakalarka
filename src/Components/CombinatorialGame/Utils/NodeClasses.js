/**
 * @fileoverview Defines the classes used to represent positions and graphs in combinatorial games.
 */

/**
 * Class representing a position/node in a combinatorial game graph.
 */
export class GamePosition {
  /**
   * Creates a new game position.
   * 
   * @param {number|string} id - The unique identifier for this position
   * @param {number} player - The player who moves from this position (1 or 2)
   * @param {Array<number|string>} parents - Array of parent position IDs
   * @param {Array<number|string>} children - Array of child position IDs
   * @param {boolean|null} isWinning - Whether this position is winning for the I. player
   */
  constructor(id, player, parents, children, isWinning) {
    this.id = id; // Internal id
    this.player = player; // Player that makes the move from this position
    this.parents = parents; // List of parent positions
    this.children = children; // List of child positions
    this.isWinning = isWinning; // Is this position winning?
  }
}
  
/**
 * Class representing the entire combinatorial game graph with all positions.
 */
export class GameGraph {
  /**
   * Creates a new game graph.
   * 
   * @param {Object<string, GamePosition>} positions - Map of position IDs to position objects
   * @param {GamePosition} startingPosition - The starting position of the game
   */
  constructor(positions, startingPosition) {
    this.positions = positions; // All positions in the graph
    this.startingPosition = startingPosition; // starting position
  }
}
