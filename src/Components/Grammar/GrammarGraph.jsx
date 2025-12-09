import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../Hooks/useGraphColors';
import { useGraphSettings } from '../../Hooks/useGraphSettings';

export function GrammarGraph({ grammar }) {
    const fgRef = useRef();
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const [showText, setShowText] = useState(false);

    const colors = useGraphColors(); // Re-added colors definition
    const settings = useGraphSettings();
    const { mcvp, grammar: grammarSettings } = settings; // Destructure mcvp and new grammar settings

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;
        const updateDimensions = () => {
            const { width, height } = containerRef.current.getBoundingClientRect();
            if (width > 0 && height > 0) {
                setDimensions({ width, height });
            }
        };
        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Transform grammar to graph data
    const graphData = useMemo(() => {
        try {
            if (!grammar) return { nodes: [], links: [] };

            const nodes = [];
            const links = [];
            const addedNodes = new Set();
            const allSymbols = new Set(grammar.getAllSymbols());

            const addNode = (id, type) => {
                if (!addedNodes.has(id)) {
                    nodes.push({ id, type });
                    addedNodes.add(id);
                }
            };

            if (grammar.nonTerminals) {
                grammar.nonTerminals.forEach(nt => addNode(nt, 'non-terminal'));
            }
            if (grammar.terminals) {
                grammar.terminals.forEach(t => addNode(t, 'terminal'));
            }

            if (grammar.productions) {
                Object.entries(grammar.productions).forEach(([lhs, rhss]) => {
                    addNode(lhs, 'non-terminal');
                    if (Array.isArray(rhss)) {
                        rhss.forEach(rhs => {
                            if (Array.isArray(rhs)) {
                                rhs.forEach(symbol => {
                                    if (allSymbols.has(symbol)) {
                                        const isTerm = grammar.isTerminal(symbol);
                                        addNode(symbol, isTerm ? 'terminal' : 'non-terminal');
                                        links.push({ source: lhs, target: symbol });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            return { nodes, links };
        } catch (err) {
            console.error("Error in GrammarGraph graphData calculation:", err);
            return { nodes: [], links: [] };
        }
    }, [grammar]);

    const paintNode = useCallback((node, ctx) => {
        const radius = mcvp.nodeRadius;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        
        if (node.type === 'non-terminal') {
             ctx.fillStyle = colors.defaultNode; 
             ctx.strokeStyle = colors.outerCircle;
        } else {
             ctx.fillStyle = colors.selected; 
             ctx.strokeStyle = colors.nodeStroke;
        }
        
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = mcvp.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colors.nodeText;
        ctx.fillText(node.id, node.x, node.y);
    }, [colors, mcvp]);

    const paintLink = useCallback((link, ctx) => {
        ctx.strokeStyle = colors.defaultLink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
    }, [colors]);

    return (
        <div className="grammar-graph-container">
            <div 
                className="graph-visualization card" 
                ref={containerRef} 
                style={{ 
                    height: '500px', 
                    position: 'relative', 
                    overflow: 'hidden',
                    backgroundColor: colors.canvasBackgroundColor // Use new unified background color
                }}
            >
                {graphData.nodes.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                        {grammar ? 'Gramatika nemá žádné symboly k zobrazení.' : 'Žádná gramatika.'}
                    </div>
                ) : (
                    <>
                        <ForceGraph2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={graphData}
                            nodeCanvasObject={paintNode}
                            linkCanvasObject={paintLink}
                            nodeLabel="id"
                            linkDirectionalArrowLength={grammarSettings.linkDirectionalArrowLength} // Use grammar-specific setting
                            linkDirectionalArrowRelPos={1}
                            cooldownTime={2000}
                        />
                        <button 
                            className="btn btn-sm btn-light position-absolute shadow-sm" 
                            style={{ top: 10, right: 10, zIndex: 1000 }}
                            onClick={() => fgRef.current?.zoomToFit(400)}
                        >
                            Vycentrovat
                        </button>
                    </>
                )}
            </div>
            
            <div className="text-representation mt-3">
                <button 
                    className="btn btn-outline-secondary mb-2 w-100 text-start d-flex justify-content-between align-items-center"
                    onClick={() => setShowText(!showText)}
                    aria-expanded={showText}
                >
                    <span>{showText ? 'Skrýt textový zápis' : 'Zobrazit textový zápis'}</span>
                    <span>{showText ? '▲' : '▼'}</span>
                </button>
                
                {showText && (
                     <div className="card card-body bg-light border-top-0 rounded-0 rounded-bottom">
                        <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {grammar.toText ? grammar.toText() : JSON.stringify(grammar, null, 2)}
                        </pre>
                     </div>
                )}
            </div>
        </div>
    );
}

GrammarGraph.propTypes = {
    grammar: PropTypes.object
};