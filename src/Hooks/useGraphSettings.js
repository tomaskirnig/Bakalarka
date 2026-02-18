import { useMemo } from 'react';

/**
 * Custom hook to centralize graph settings (dimensions, fonts, layout params).
 * 
 * @returns {Object} An object containing settings for different graph types.
 */
export function useGraphSettings() {
    return useMemo(() => ({
        mcvp: {
            nodeRadius: 20,
            labelFontSize: 12,
            labelFont: '12px monospace',
            resultLabelOffsetMultiplier: 1.4,
            // Collision force settings
            collisionRadiusMultiplier: 1.2,
            collisionStrength: 0.8,
            collisionIterations: 2,
            // Layout settings
            dagLevelDistance: 100,
            linkDistance: 100,
            linkStrength: 1,
            chargeStrength: -100,
            // Physics settings
            cooldownTime: 2000,
            d3AlphaDecay: 0.08,
            d3VelocityDecay: 0.6
        },
        game: {
             nodeRadius: 8,
             labelFontSize: 8,
             labelFont: '8px monospace',
             highlightScale: 1.2,
             linkDirectionalArrowLength: 1
        },
        grammar: {
             nodeRadius: 8,
             labelFontSize: 8,
             labelFont: '8px monospace',
             highlightScale: 1.2,
             linkDirectionalArrowLength: 7
        }
    }), []);
}
