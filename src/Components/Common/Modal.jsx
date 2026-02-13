import { useState } from 'react';
import PropTypes from 'prop-types';

export function Modal({ onClose, children, title }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 250);
    };

    return (
        <div className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`} onClick={handleClose}>
            <div className={`modal-content-modern ${isClosing ? 'modal-content-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-modern">
                    {title && <h5 className="modal-title-modern">{title}</h5>}
                    <button 
                        onClick={handleClose} 
                        className="modal-close-btn-modern"
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="modal-body-modern">
                    {children}
                </div>
            </div>
        </div>
    );
}

Modal.propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string
};