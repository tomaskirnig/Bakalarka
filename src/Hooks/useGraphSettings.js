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
            collisionRadiusMultiplier: 2,
            dagLevelDistance: 100,
            linkDistance: 100,
            chargeStrength: -200,
            cooldownTime: 3000
        },
        game: {
             nodeRadius: 8,
             labelFontSize: 8,
             labelFont: '8px monospace',
             highlightScale: 1.2,
             dagLevelDistance: 70, 
        }
    }), []);
}
