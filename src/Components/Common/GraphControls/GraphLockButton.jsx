import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Toggle button for locking or unlocking graph node positions.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Lock control button.
 */
export default function GraphLockButton({
  isLocked,
  onToggle,
  lockedLabel = '🔒 Odemknout graf',
  unlockedLabel = '🔓 Zamknout graf',
  lockedTitle = 'Odemknout pozice uzlů',
  unlockedTitle = 'Zamknout pozice uzlů',
  lockedTooltip = 'Odemknout pozice všech uzlů',
  unlockedTooltip = 'Zamknout pozice všech uzlů na místě',
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        className="graph-btn"
        onClick={onToggle}
        style={
          isLocked
            ? { color: 'var(--color2)', borderColor: 'var(--color2)', fontWeight: 700 }
            : undefined
        }
        title={isLocked ? lockedTitle : unlockedTitle}
      >
        {isLocked ? lockedLabel : unlockedLabel}
      </button>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'rgba(7, 57, 60, 0.95)',
            color: 'white',
            fontSize: '0.75rem',
            padding: '5px 9px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            border: '1px solid rgba(144, 221, 240, 0.3)',
            zIndex: 10,
          }}
        >
          {isLocked ? lockedTooltip : unlockedTooltip}
        </div>
      )}
    </div>
  );
}

GraphLockButton.propTypes = {
  isLocked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  lockedLabel: PropTypes.string,
  unlockedLabel: PropTypes.string,
  lockedTitle: PropTypes.string,
  unlockedTitle: PropTypes.string,
  lockedTooltip: PropTypes.string,
  unlockedTooltip: PropTypes.string,
};
