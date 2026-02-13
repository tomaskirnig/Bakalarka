import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal component specifically designed for conversion views
 * Takes up most of the screen for better visibility of conversion steps
 */
export function ConversionModal({ onClose, children }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 250);
    };

    return (
        <div className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`} onClick={handleClose}>
            <div className={`conversion-modal-content ${isClosing ? 'modal-content-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={handleClose} 
                    className="conversion-modal-close-btn"
                    aria-label="Close"
                >
                    ×
                </button>
                <div className="conversion-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

ConversionModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string
};
