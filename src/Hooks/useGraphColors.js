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
        accentYellow: '#FFD700',
        accentRed: '#FF6347',
        selected: '#FFB74D',
        
        defaultLink: '#999',
        dimmedLink: 'rgba(200,200,200,0.15)',
        
        nodeStroke: '#333',
        nodeText: '#fff',
        outerCircle: '#07393C',
        
        text: '#F0EDEE',
        instructionText: '#666',
        
        linkColor: '#ece5f0',
        nodeColor: '#2C666E',
        backgroundColor: '#F0EDEE',
        canvasBackgroundColor: 'white'
    });

    useEffect(() => {
        const updateColors = () => {
            const styles = getComputedStyle(document.documentElement);
            
            // Helper to safely get property
            const getVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

            setColors({
                // Nodes
                defaultNode: getVar('--color1', '#438c96'),
                highlightNode: getVar('--color4', '#90DDF0'),
                accentYellow: getVar('--color-accent-yellow', '#FFD700'),
                accentRed: getVar('--color-accent-red', '#FF6347'),
                selected: getVar('--color-accent-orange', '#FFB74D'),
                nodeColor: getVar('--color2', '#2C666E'),
                outerCircle: getVar('--color3', '#07393C'),

                // Links
                defaultLink: getVar('--color-grey', '#999'),
                dimmedLink: 'rgba(200,200,200,0.15)',
                linkColor: getVar('--color-grey-light-purple', '#ece5f0'),
                
                // Text & Stroke
                nodeStroke: getVar('--color-grey-dark', '#333'),
                nodeText: getVar('--color-white', '#fff'),
                text: getVar('--root-background-color', '#F0EDEE'),
                instructionText: getVar('--color-grey-medium', '#666'),

                // Backgrounds
                backgroundColor: getVar('--root-background-color', '#F0EDEE'),
                canvasBackgroundColor: getVar('--canvas-background-color', 'white'),
            });
        };

        updateColors();
    }, []); 

    return colors;
}