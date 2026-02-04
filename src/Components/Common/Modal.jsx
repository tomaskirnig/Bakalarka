import PropTypes from 'prop-types';

export function Modal({ onClose, children }) {
    return (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex justify-content-center align-items-center modal-overlay">
            <div className="bg-white rounded-3 text-center modal-content">
                <div className="position-relative h-100 d-flex flex-column">
                    <button 
                        onClick={onClose} 
                        className="position-absolute top-0 bg-transparent border-0 fs-4 modal-close-btn">
                        &#x2715;
                    </button>
                    <div className="h-100 pt-3 pb-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

Modal.propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};