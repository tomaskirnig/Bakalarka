/**
 * Draws an arrowhead near the source side of a link, pointing in reversed
 * visual direction relative to the source->target line.
 */
export function drawReversedArrowhead(ctx, sourceX, sourceY, targetX, targetY, nodeRadius = 10) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const linkLength = Math.hypot(dx, dy);
  if (linkLength < 1e-6) return;

  const ux = dx / linkLength;
  const uy = dy / linkLength;
  const arrowLength = 8;
  const arrowWidth = 6;

  const tipX = sourceX + ux * (nodeRadius + 1);
  const tipY = sourceY + uy * (nodeRadius + 1);
  const baseCenterX = tipX + ux * arrowLength;
  const baseCenterY = tipY + uy * arrowLength;
  const perpX = -uy;
  const perpY = ux;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseCenterX + perpX * (arrowWidth / 2), baseCenterY + perpY * (arrowWidth / 2));
  ctx.lineTo(baseCenterX - perpX * (arrowWidth / 2), baseCenterY - perpY * (arrowWidth / 2));
  ctx.closePath();
  ctx.fill();
}
