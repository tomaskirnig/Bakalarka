import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Modal } from './Modal';
import { useGraphColors } from '../../Hooks/useGraphColors';

export function FileTransferControls({ 
    onExport, 
    onImport, 
    instructionText, 
    fileName = "data.json",
    showPositionOption = true
}) {
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [includePositions, setIncludePositions] = useState(showPositionOption);
    const [dragActive, setDragActive] = useState(false);
    const [hoverImport, setHoverImport] = useState(false);
    const [hoverExport, setHoverExport] = useState(false);
    const fileInputRef = useRef(null);
    const colors = useGraphColors();

    const handleExportClick = () => {
        setShowExportModal(true);
    };

    const performExport = () => {
        try {
            const data = onExport(includePositions);
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
            setShowExportModal(false);
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
                className="FileTransferControls-container position-absolute d-flex gap-2 align-items-center" 
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
                    <div className="text-center">
                        <p className="modal-description">
                            {instructionText || "Nahrajte soubor JSON s daty pro aktualizaci grafu."}
                        </p>

                        <div
                            className={`file-drop-zone ${dragActive ? 'file-drop-zone-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            <div className="file-drop-icon">
                                <i className="bi bi-cloud-arrow-up"></i>
                            </div>

                            <h6 className="file-drop-title">Přetáhněte soubor sem</h6>
                            <span className="file-drop-subtitle">nebo klikněte pro výběr ze zařízení</span>
                        </div>

                        <div className="mt-3 text-center">
                             <span className="file-type-badge">
                                <i className="bi bi-filetype-json me-1"></i>
                                JSON soubor
                             </span>
                        </div>
                    </div>
                </Modal>
            )}

            {showExportModal && (
                <Modal onClose={() => setShowExportModal(false)} title="Exportovat data">
                    <div>
                        <p className="modal-description text-center">
                            Vyberte možnosti exportu a stáhněte soubor JSON.
                        </p>

                        {showPositionOption && (
                            <div className="export-option-card">
                                <div className="d-flex align-items-start">
                                    <input
                                        className="form-check-input-modern"
                                        type="checkbox"
                                        id="includePositionsCheckbox"
                                        checked={includePositions}
                                        onChange={(e) => setIncludePositions(e.target.checked)}
                                    />
                                    <label className="export-option-label" htmlFor="includePositionsCheckbox">
                                        <div className="export-option-title">
                                            <i className="bi bi-pin-map me-2"></i>
                                            Zahrnout pozice uzlů
                                        </div>
                                        <div className="export-option-description">
                                            Exportovat aktuální pozice uzlů v grafu. Při importu bude graf vypadat stejně.
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn-modal-secondary"
                                onClick={() => setShowExportModal(false)}
                            >
                                Zrušit
                            </button>
                            <button
                                className="btn-modal-primary"
                                onClick={performExport}
                            >
                                <i className="bi bi-download me-2"></i>
                                Exportovat
                            </button>
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
    fileName: PropTypes.string,
    showPositionOption: PropTypes.bool
};
