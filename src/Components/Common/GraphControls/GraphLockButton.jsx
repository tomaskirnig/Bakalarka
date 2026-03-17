import { useState } from 'react';
import PropTypes from 'prop-types';

export default function GraphLockButton({ isLocked, onToggle }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className="graph-btn"
        onClick={onToggle}
        style={
          isLocked
            ? { color: 'var(--color2)', borderColor: 'var(--color2)', fontWeight: 700 }
            : undefined
        }
        title={isLocked ? 'Odemknout pozice uzlů' : 'Zamknout pozice uzlů'}
      >
        {isLocked ? '🔒 Zamčeno' : '🔓 Zamknout'}
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
          {isLocked ? 'Odemknout pozice všech uzlů' : 'Zamknout pozice všech uzlů na místě'}
        </div>
      )}
    </div>
  );
}

GraphLockButton.propTypes = {
  isLocked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
