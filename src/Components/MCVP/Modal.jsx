import PropTypes from 'prop-types';

export function Modal({ onClose, children }) {
    return (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 }}>
            <div className="bg-white rounded-3 text-center" style={{ width: '95%', height: '95%', overflow: 'auto' }}>
                <div className="position-relative">
                    <button 
                        onClick={onClose} 
                        className="position-absolute top-0 bg-transparent border-0 fs-4"
                        style={{ cursor: 'pointer', right: '15px'}}>
                        &#x2715;
                    </button>
                    <div className="mt-3">
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