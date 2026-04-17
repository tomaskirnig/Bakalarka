import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const CLOSE_ANIMATION_MS = 250;

/**
 * Modal component specifically designed for conversion views
 * Takes up most of the screen for better visibility of conversion steps
 */
export function ConversionModal({ onClose, children }) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    timerRef.current = setTimeout(() => {
      onClose();
    }, CLOSE_ANIMATION_MS);
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`} onClick={handleClose}>
      <div
        className={`conversion-modal-content ${isClosing ? 'modal-content-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="conversion-modal-close-btn"
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
        <div className="conversion-modal-body">{children}</div>
      </div>
    </div>
  );
}

ConversionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
