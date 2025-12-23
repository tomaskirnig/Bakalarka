import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Modal } from './Modal';
import { useGraphColors } from '../../Hooks/useGraphColors';

export function FileTransferControls({ onExport, onImport, instructionText, fileName = "data.json" }) {
    const [showImportModal, setShowImportModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [hoverImport, setHoverImport] = useState(false);
    const [hoverExport, setHoverExport] = useState(false);
    const fileInputRef = useRef(null);
    const colors = useGraphColors();

    const handleExportClick = () => {
        try {
            const data = onExport();
            if (!data) {
                toast.warning("Žádná data k exportu.");
                return;
            }
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Export dokončen.");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export se nezdařil.");
        }
    };

    const processFile = (file) => {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                onImport(json);
                setShowImportModal(false);
                toast.success("Import úspěšný.");
            } catch (error) {
                console.error("Import error:", error);
                // Differentiate between JSON parse errors and validation errors from onImport
                if (error instanceof SyntaxError) {
                    toast.error("Chyba při čtení souboru: Neplatný formát JSON.");
                } else {
                    toast.error(`Chyba importu: ${error.message}`);
                }
            }
        };
        reader.readAsText(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const getBtnStyle = (isHover) => ({
        backgroundColor: isHover ? colors.defaultNode : 'white',
        color: isHover ? 'white' : undefined,
        borderColor: isHover ? colors.defaultNode : undefined,
        transition: 'all 0.2s ease'
    });

    return (
        <>
            <div 
                className="position-absolute d-flex gap-2 align-items-center" 
                style={{ top: '100px', right: '55px', zIndex: 1040 }}
            >
                <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => setShowImportModal(true)}
                    title="Importovat ze souboru"
                    style={getBtnStyle(hoverImport)}
                    onMouseEnter={() => setHoverImport(true)}
                    onMouseLeave={() => setHoverImport(false)}
                >
                    Import
                </button>
                <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={handleExportClick}
                    title="Exportovat do souboru"
                    style={getBtnStyle(hoverExport)}
                    onMouseEnter={() => setHoverExport(true)}
                    onMouseLeave={() => setHoverExport(false)}
                >
                    Export
                </button>
            </div>

            {showImportModal && (
                <Modal onClose={() => setShowImportModal(false)} title="Importovat data">
                    <div className="p-4 text-center">
                        <p className="mb-4 text-muted small">
                            {instructionText || "Nahrajte soubor JSON s daty pro aktualizaci grafu."}
                        </p>
                        
                        <div 
                            className={`
                                d-flex flex-column align-items-center justify-content-center
                                p-4 border border-2 border-dashed rounded-3
                                ${dragActive ? 'bg-light border-primary' : 'border-secondary-subtle'}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ minHeight: '180px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept=".json" 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }} 
                            />
                            
                            <div className={`mb-2 p-3 rounded-circle ${dragActive ? 'bg-primary-subtle' : 'bg-light'}`}>
                                <i className={`bi bi-cloud-arrow-up fs-2 ${dragActive ? 'text-primary' : 'text-secondary'}`}></i>
                            </div>
                            
                            <h6 className="fw-semibold mb-1 text-dark">Přetáhněte soubor sem</h6>
                            <span className="text-muted small">nebo klikněte pro výběr ze zařízení</span>
                        </div>
                        
                        <div className="mt-3 text-center">
                             <span className="badge bg-light text-secondary border fw-normal">.json</span>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

FileTransferControls.propTypes = {
    onExport: PropTypes.func.isRequired,
    onImport: PropTypes.func.isRequired,
    instructionText: PropTypes.string,
    fileName: PropTypes.string
};
