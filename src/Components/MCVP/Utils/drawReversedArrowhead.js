/**
 * Draws an arrowhead near the source side of a link, pointing in reversed
 * visual direction relative to the source->target line.
 */
const MIN_LINK_LENGTH = 1e-6;
const ARROW_LENGTH = 6;
const ARROW_WIDTH = 4;

export function drawReversedArrowhead(ctx, sourceX, sourceY, targetX, targetY, nodeRadius = 10) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const linkLength = Math.hypot(dx, dy);
  if (linkLength < MIN_LINK_LENGTH) return;

  const ux = dx / linkLength;
  const uy = dy / linkLength;

  const tipX = sourceX + ux * (nodeRadius + 1);
  const tipY = sourceY + uy * (nodeRadius + 1);
  const baseCenterX = tipX + ux * ARROW_LENGTH;
  const baseCenterY = tipY + uy * ARROW_LENGTH;
  const perpX = -uy;
  const perpY = ux;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseCenterX + perpX * (ARROW_WIDTH / 2), baseCenterY + perpY * (ARROW_WIDTH / 2));
  ctx.lineTo(baseCenterX - perpX * (ARROW_WIDTH / 2), baseCenterY - perpY * (ARROW_WIDTH / 2));
  ctx.closePath();
  ctx.fill();
}
