import PropTypes from 'prop-types';

export function Modal({ onClose, children, title }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-modern">
                    {title && <h5 className="modal-title-modern">{title}</h5>}
                    <button 
                        onClick={onClose} 
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