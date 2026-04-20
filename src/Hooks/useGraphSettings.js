import { useMemo } from 'react';

/**
 * Custom hook to centralize graph settings (dimensions, fonts, layout params).
 *
 * @returns {Object} An object containing settings for different graph types.
 */
export function useGraphSettings() {
  return useMemo(
    () => ({
      mcvp: {
        nodeRadius: 20,
        labelFontSize: 12,
        labelFont: '12px monospace',
        linkIdFont: '8px Sans-Serif',
        resultLabelOffsetMultiplier: 1.4,
        // Collision force settings
        collisionRadiusMultiplier: 1.05,
        collisionStrength: 0.7,
        collisionIterations: 2,
        // Layout settings
        dagLevelDistance: 100,
        linkDistance: 100,
        linkStrength: 1,
        chargeStrength: -100,
        // Physics settings
        cooldownTime: 2000,
        d3AlphaDecay: 0.08,
        d3VelocityDecay: 0.6,
      },
      game: {
        nodeRadius: 8,
        labelFontSize: 8,
        labelFont: '8px monospace',
        nodeIdFont: '5px Arial',
        winningLabelFont: 'bold 10px monospace',
        winningLabelColor: '#198754',
        playerLabelOffset: 10,
        highlightScale: 1.2,
        linkDirectionalArrowLength: 6,
        dynamicLinkDistanceBase: 50,
        dynamicLinkDistancePerEdge: 1.5,
        dynamicLinkDistanceMax: 300,
        manualInputCollisionRadiusMultiplier: 1.05,
        manualInputCollisionStrength: 0.7,
        manualInputCollisionIterations: 8,
        manualInputLinkDistance: 50,
        manualInputLinkStrength: 1,
      },
      grammar: {
        nodeRadius: 8,
        labelFontSize: 8,
        labelFont: '8px monospace',
        highlightScale: 1.2,
        collisionRadiusMultiplier: 1.05,
        collisionIterations: 2,
        linkDistance: 40,
        chargeStrength: -100,
        dagLevelDistance: 50,
        cooldownTime: 3000,
        d3AlphaDecay: 0.02,
        linkDirectionalArrowLength: 4,
      },
    }),
    []
  );
}
