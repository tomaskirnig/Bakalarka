import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and return graph colors from CSS variables.
 * 
 * @returns {Object} An object containing all the graph colors.
 */
export function useGraphColors() {
    const [colors, setColors] = useState({
        defaultNode: '#438c96',
        highlightNode: '#90DDF0',
        starting: '#FF6347',
        defaultLink: '#999',
        optimalLink: '#FFD700',
        highlightLink: 'red',
        activeNode: '#FFD700',
        nodeStroke: '#333',
        nodeText: '#fff',
        outerCircle: '#07393C',
        innerCircle: '#438c96',
        selected: '#FFB74D',
        text: '#F0EDEE',
        hover: '#90DDF0',
        instructionText: '#666',
        linkColor: '#ece5f0',
        nodeColor: '#2C666E',
        backgroundColor: '#F0EDEE',
        color1: '#438c96',
        color4: '#90DDF0',
        dimmedLink: 'rgba(200,200,200,0.15)'
    });

    useEffect(() => {
        const updateColors = () => {
            const styles = getComputedStyle(document.documentElement);
            
            // Helper to safely get property
            const getVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

            setColors({
                // Common
                defaultNode: getVar('--color1', '#438c96'),
                highlightNode: getVar('--color4', '#90DDF0'),
                starting: getVar('--color-accent-red', '#FF6347'),
                defaultLink: getVar('--color-grey', '#999'),
                optimalLink: getVar('--color-accent-yellow', '#FFD700'),
                dimmedLink: 'rgba(200,200,200,0.15)', // Fixed low-opacity color for dimmed state
                
                // TreeRenderCanvas
                highlightLink: getVar('--color-accent-red', 'red'),
                activeNode: getVar('--color-accent-yellow', '#FFD700'),
                nodeStroke: getVar('--color-grey-dark', '#333'),
                nodeText: getVar('--color-white', '#fff'),
                
                // InteractiveInput
                outerCircle: getVar('--color3', '#07393C'),
                innerCircle: getVar('--color1', '#438c96'),
                selected: getVar('--color-accent-orange', '#FFB74D'),
                text: getVar('--root-background-color', '#F0EDEE'),
                hover: getVar('--color4', '#90DDF0'),
                instructionText: getVar('--color-grey-medium', '#666'),

                // NodeVisual
                linkColor: getVar('--color-grey-light-purple', '#ece5f0'),
                nodeColor: getVar('--color2', '#2C666E'),
                backgroundColor: getVar('--root-background-color', '#F0EDEE'),

                // ManualInput (redundant aliases for clarity in component)
                color1: getVar('--color1', '#438c96'),
                color4: getVar('--color4', '#90DDF0')
            });
        };

        updateColors();

        // Optional: Add listener for theme changes if implemented in future
        
        // Clean up
    }, []);

    return colors;
}
