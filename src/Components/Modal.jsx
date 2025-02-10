import React from 'react';

export function Modal({ onClose, children }) {
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.content}>
                    <button onClick={onClose} style={styles.closeButton}>X</button>
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '95%',
        height: '95%',
        textAlign: 'center',
    },
    content: {
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        // top: '10px',
        right: '0%',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
    },
};

export default Modal;
