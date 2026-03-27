import { resolveNodeId } from './ManualInput.helpers';

/**
 * Creates a node painter used by ForceGraph's nodeCanvasObject callback.
 * It draws node circles, selection state, and player labels.
 *
 * @param {Object} params - Painter configuration.
 * @returns {(node: Object, ctx: CanvasRenderingContext2D) => void} Node paint callback.
 */
export function createPaintRing({
  game,
  selectedNode,
  hoverNode,
  addingEdge,
  edgeSource,
  colors,
  startingNodeId,
}) {
  return (node, ctx) => {
    const radius = game.nodeRadius;

    const isSelected = selectedNode && node.id === selectedNode.id;
    const isHovered = hoverNode && node.id === hoverNode.id;
    const isEdgeSource = addingEdge && edgeSource && edgeSource.id === node.id;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

    let fillColor;
    if (isSelected || isEdgeSource) {
      fillColor = colors.selected;
    } else if (String(node.id) === String(startingNodeId)) {
      fillColor = colors.accentRed;
    } else {
      fillColor = colors.defaultNode;
    }

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = colors.outerCircle;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (isSelected || isHovered || isEdgeSource) {
      ctx.strokeStyle = colors.highlightNode;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = game.labelFont;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + radius + 10);
  };
}

/**
 * Creates a link label formatter that only shows labels for links connected
 * to the currently selected node.
 *
 * @param {{selectedNode: {id: string|number}|null}} params - Label formatter config.
 * @returns {(link: Object) => string} Link label callback.
 */
export function createGetLinkLabel({ selectedNode }) {
  return (link) => {
    if (!selectedNode) return '';

    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);

    if (sourceId === selectedNode.id) return `${targetId}`;
    if (targetId === selectedNode.id) return `${sourceId}`;
    return '';
  };
}

/**
 * Creates a custom link painter that renders connected-node ids next to edges
 * touching the selected node.
 *
 * @param {{selectedNode: {id: string|number}|null}} params - Link painter config.
 * @returns {(link: Object, ctx: CanvasRenderingContext2D, globalScale: number) => void} Link paint callback.
 */
export function createPaintLink({ selectedNode }) {
  return (link, ctx, globalScale) => {
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);

    if (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) {
      const start = link.source;
      const end = link.target;

      const textPos = {
        x: start.x + (end.x - start.x) * 0.5,
        y: start.y + (end.y - start.y) * 0.5,
      };

      const connectedId = sourceId === selectedNode.id ? targetId : sourceId;
      const label = `${connectedId}`;
      const fontSize = 4 + 1 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.8);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        textPos.x - bckgDimensions[0] / 2,
        textPos.y - bckgDimensions[1] / 2,
        ...bckgDimensions
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(label, textPos.x, textPos.y);
    }
  };
}
