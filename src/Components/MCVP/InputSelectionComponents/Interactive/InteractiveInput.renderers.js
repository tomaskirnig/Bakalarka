import { drawReversedArrowhead } from '../../Utils/drawReversedArrowhead';

export function createPaintNode({ selectedNode, hoverNode, edgeSource, colors, mcvp }) {
  return (node, ctx) => {
    const radius = mcvp.nodeRadius;
    const isSelected = selectedNode && node.id === selectedNode.id;
    const isHovered = hoverNode && node.id === hoverNode.id;
    const isEdgeSource = edgeSource && node.id === edgeSource.id;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = isSelected || isEdgeSource ? colors.selected : colors.defaultNode;
    ctx.fill();

    ctx.strokeStyle = colors.outerCircle;
    ctx.stroke();

    if (isSelected || isHovered || isEdgeSource) {
      ctx.strokeStyle = colors.highlightNode;
      ctx.stroke();
    }

    let displayText = '';
    if (node.type === 'variable') {
      displayText = `${node.value}[${node.varValue}]`;
    } else {
      displayText = node.value === 'A' ? 'AND' : node.value === 'O' ? 'OR' : node.value;
    }

    ctx.font = mcvp.labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors.text;
    ctx.fillText(displayText, node.x, node.y);
  };
}

export function createPaintLink({ selectedNode, nodeRadius, linkIdFont }) {
  return (link, ctx) => {
    if (
      !link.source ||
      !link.target ||
      typeof link.source.x === 'undefined' ||
      typeof link.target.x === 'undefined'
    ) {
      return;
    }

    const start = link.source;
    const end = link.target;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    drawReversedArrowhead(ctx, start.x, start.y, end.x, end.y, nodeRadius || 10);

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    let shouldDisplayLinkId = false;
    if (selectedNode && link.id !== undefined && link.id !== null) {
      if (link.source.id === selectedNode.id || link.target.id === selectedNode.id) {
        shouldDisplayLinkId = true;
      }
    }

    if (shouldDisplayLinkId && link.id !== undefined && link.id !== null) {
      ctx.font = linkIdFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'red';
      ctx.fillText(link.id, midX, midY + 10);
    }
  };
}
