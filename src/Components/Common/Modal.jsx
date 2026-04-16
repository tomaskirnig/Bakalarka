import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const CLOSE_ANIMATION_MS = 250;

/**
 * Reusable modal dialog with closing animation support.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Modal wrapper with title and content.
 */
export function Modal({ onClose, children, title }) {
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
        className={`modal-content-modern ${isClosing ? 'modal-content-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-modern">
          {title && <h5 className="modal-title-modern">{title}</h5>}
          <button
            type="button"
            onClick={handleClose}
            className="modal-close-btn-modern"
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body-modern">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};
