import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { convertMCVPtoGame } from './ConversionCombinatorialGame';
import { DisplayGraph } from '../../CombinatorialGame/Utils/DisplayGraph';

export default function MCVPtoCombinatorialGameConverter({ mcvpTree, onNavigate }) {
    const [gameGraph, setGameGraph] = useState(null);

    useEffect(() => {
        if (mcvpTree) {
            const graph = convertMCVPtoGame(mcvpTree);
            setGameGraph(graph);
        }
    }, [mcvpTree]);

    const handleRedirect = () => {
        if (onNavigate && gameGraph) {
            // Navigate to CombinatorialGame page and pass the converted graph
            onNavigate('CombinatorialGame', gameGraph);
        }
    };

    return (
        <div className="p-3">
            <h2 className="text-center mb-4">Převod na Kombinatorickou hru</h2>
            
            <div className="alert alert-info">
                <strong>Pravidla převodu:</strong>
                <ul className="mb-0 text-start" style={{ display: 'inline-block', textAlign: 'left' }}>
                    <li><strong>OR</strong> hradlo &rarr; Pozice <strong>Hráče I</strong> (vybírá tah)</li>
                    <li><strong>AND</strong> hradlo &rarr; Pozice <strong>Hráče II</strong> (vybírá tah)</li>
                    <li><strong>Vstup = 1</strong> &rarr; Pozice Hráče II bez tahů (Hráč II prohrává, Hráč I vyhrává)</li>
                    <li><strong>Vstup = 0</strong> &rarr; Pozice Hráče I bez tahů (Hráč I prohrává)</li>
                </ul>
            </div>

            {gameGraph ? (
                <>
                    <div style={{ height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        <DisplayGraph graph={gameGraph} />
                    </div>
                    
                    <div className="text-center mt-4">
                        <button className="btn btn-success btn-lg" onClick={handleRedirect}>
                            Otevřít v Kombinatorické hře
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-center">Generování grafu...</p>
            )}
        </div>
    );
}

MCVPtoCombinatorialGameConverter.propTypes = {
    mcvpTree: PropTypes.object.isRequired,
    onNavigate: PropTypes.func // Function to handle navigation
};
