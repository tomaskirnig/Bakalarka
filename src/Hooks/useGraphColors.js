import { useState, useEffect } from 'react';

const DEFAULT_GRAPH_COLORS = {
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
  canvasBackgroundColor: 'white',
};

const getVar = (styles, name, fallback) => styles.getPropertyValue(name).trim() || fallback;

const resolveGraphColors = () => {
  const styles = getComputedStyle(document.documentElement);

  return {
    // Nodes
    defaultNode: getVar(styles, '--color1', DEFAULT_GRAPH_COLORS.defaultNode),
    highlightNode: getVar(styles, '--color4', DEFAULT_GRAPH_COLORS.highlightNode),
    accentYellow: getVar(styles, '--color-accent-yellow', DEFAULT_GRAPH_COLORS.accentYellow),
    accentRed: getVar(styles, '--color-accent-red', DEFAULT_GRAPH_COLORS.accentRed),
    selected: getVar(styles, '--color-accent-orange', DEFAULT_GRAPH_COLORS.selected),
    nodeColor: getVar(styles, '--color2', DEFAULT_GRAPH_COLORS.nodeColor),
    outerCircle: getVar(styles, '--color3', DEFAULT_GRAPH_COLORS.outerCircle),

    // Links
    defaultLink: getVar(styles, '--color-grey', DEFAULT_GRAPH_COLORS.defaultLink),
    dimmedLink: DEFAULT_GRAPH_COLORS.dimmedLink,
    linkColor: getVar(styles, '--color-grey-light-purple', DEFAULT_GRAPH_COLORS.linkColor),

    // Text & Stroke
    nodeStroke: getVar(styles, '--color-grey-dark', DEFAULT_GRAPH_COLORS.nodeStroke),
    nodeText: getVar(styles, '--color-white', DEFAULT_GRAPH_COLORS.nodeText),
    text: getVar(styles, '--root-background-color', DEFAULT_GRAPH_COLORS.text),
    instructionText: getVar(styles, '--color-grey-medium', DEFAULT_GRAPH_COLORS.instructionText),

    // Backgrounds
    backgroundColor: getVar(
      styles,
      '--root-background-color',
      DEFAULT_GRAPH_COLORS.backgroundColor
    ),
    canvasBackgroundColor: getVar(
      styles,
      '--canvas-background-color',
      DEFAULT_GRAPH_COLORS.canvasBackgroundColor
    ),
  };
};

/**
 * Custom hook to fetch and return graph colors from CSS variables.
 *
 * @returns {Object} An object containing all the graph colors.
 */
export function useGraphColors() {
  const [colors, setColors] = useState(() => ({ ...DEFAULT_GRAPH_COLORS }));

  useEffect(() => {
    setColors(resolveGraphColors());
  }, []);

  return colors;
}
