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
   * @param {string} id - The unique identifier for this position
   * @param {number} player - The player who moves from this position (1 or 2)
   * @param {Array<string>} parents - Array of parent position IDs
   * @param {Array<string>} children - Array of child position IDs
   */
  constructor(id, player, parents, children) {
    this.id = id; // Internal id
    this.player = player; // Player that makes the move from this position
    this.parents = parents; // List of parent positions
    this.children = children; // List of child positions
  }
}
  
/**
 * Class representing the entire combinatorial game graph with all positions.
 */
export class GameGraph {
  /**
   * Creates a new game graph.
   * 
   * @param {Object<string, GamePosition>} positions - Object mapping position IDs to GamePosition objects, representing all positions in the game
   * @param {GamePosition} startingPosition - The starting position of the game
   */
  constructor(positions, startingPosition) {
    this.positions = positions; // All positions in the graph
    this.startingPosition = startingPosition; // starting position
  }
}
