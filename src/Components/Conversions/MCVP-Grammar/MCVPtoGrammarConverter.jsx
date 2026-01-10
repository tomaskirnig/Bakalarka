import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TreeRenderCanvas } from '../../MCVP/TreeRenderCanvas';
import ConversionGrammar from './ConversionGrammar';

/**
 * Generates non-terminal symbols for MCVP nodes
 */
class NonTerminalGenerator {
  constructor() {
    this.counter = 0;
    this.nodeMap = new Map();
  }

  getSymbolForNode(node, startSymbol = null) {
    if (this.nodeMap.has(node)) {
      return this.nodeMap.get(node);
    }

    let symbol;
    if (startSymbol) {
      symbol = startSymbol;
    } else if (node.type === "variable") {
      symbol = node.value;
    } else {
      symbol = `${node.value}${this.counter++}`;
    }

    this.nodeMap.set(node, symbol);
    return symbol;
  }

  getSymbol(node) {
    return this.nodeMap.get(node);
  }

  getAllSymbols() {
    return Array.from(this.nodeMap.entries()).map(([node, symbol]) => ({
      node: node,
      result: symbol
    }));
  }
}

/**
 * Handles the conversion logic from MCVP to Grammar
 */
class MCVPToGrammarConverter {
  constructor(mcvpTree) {
    this.mcvpTree = mcvpTree;
    this.grammar = new ConversionGrammar();
    this.symbolGenerator = new NonTerminalGenerator();
    this.steps = [];
    this.processedNodes = new Set();
    this.productionNodes = new Set();
  }

  /**
   * Main conversion method that orchestrates the entire process
   */
  convert() {
    if (!this.mcvpTree) {
      return [];
    }

    try {
      this.addInitializationStep();
      this.processNodes();
      this.createProductions();
      this.addFinalStep();
      return this.steps;
    } catch (error) {
      console.error('Error during MCVP to Grammar conversion:', error);
      return [{
        description: "Konverze selhala",
        mcvpHighlight: null,
        grammar: new ConversionGrammar().serialize(),
        visualNote: "Během konverze došlo k chybě",
        symbols: []
      }];
    }
  }

  addInitializationStep() {
    this.steps.push({
      description: "Inicializace gramatiky s počátečním symbolem S",
      mcvpHighlight: null,
      grammar: this.grammar.serialize(),
      visualNote: "Začínáme s gramatikou obsahující pouze počáteční symbol S",
      symbols: this.symbolGenerator.getAllSymbols()
    });
  }

  addFinalStep() {
    this.steps.push({
      description: "Konverze dokončena",
      mcvpHighlight: null,
      grammar: this.grammar.serialize(),
      visualNote: "MCVP byl úspěšně převeden na bezkontextovou gramatiku",
      symbols: this.symbolGenerator.getAllSymbols()
    });
  }

  addStep(description, highlightNode, visualNote) {
    this.steps.push({
      description,
      mcvpHighlight: highlightNode,
      grammar: this.grammar.serialize(),
      visualNote,
      symbols: this.symbolGenerator.getAllSymbols()
    });
  }

  processNodes() {
    // Map root to start symbol
    this.symbolGenerator.getSymbolForNode(this.mcvpTree, "S");
    this.processNodeRecursively(this.mcvpTree);
  }

  processNodeRecursively(node) {
    if (!node || this.processedNodes.has(node)) return;
    this.processedNodes.add(node);

    const nodeSymbol = this.symbolGenerator.getSymbolForNode(node);
    
    // All nodes become non-terminals
    this.grammar.addNonTerminal(nodeSymbol);
    
    // For variable nodes with value 1, we'll add epsilon production later
    // For variable nodes with value 0, we add a terminal that won't have a production
    if (node.type === "variable" && node.varValue === 0) {
      const terminal = `${node.value}_0`;
      this.grammar.addTerminal(terminal);
    }

    // Add step for this node
    const nodeTypeDisplay = node.type === "operation" 
      ? (node.value === "A" ? "AND" : "OR") 
      : `proměnná ${node.value}[${node.varValue}]`;
    
    const nodeDescription = node.type === "operation" 
      ? "neterminál" 
      : (node.varValue === 1 ? "neterminál s epsilon pravidlem" : "neterminál s terminálem");
    
    this.addStep(
      `Přidat ${nodeDescription} ${nodeSymbol} pro ${nodeTypeDisplay}`,
      node,
      `Vytvořen ${nodeDescription} ${nodeSymbol} pro uzel ${node.type === "variable" ? `${node.value}[${node.varValue}]` : node.value}`
    );

    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.processNodeRecursively(child);
      });
    }
  }

  createProductions() {
    this.createProductionsRecursively(this.mcvpTree);
  }

  createProductionsRecursively(node) {
    if (!node || this.productionNodes.has(node)) return;
    this.productionNodes.add(node);

    const nodeSymbol = this.symbolGenerator.getSymbol(node);
    if (!nodeSymbol) return;

    // Handle variable nodes
    if (node.type === "variable") {
      if (node.varValue === 1) {
        // Variable with value 1 generates epsilon
        this.grammar.setProductions(nodeSymbol, [['ε']]);
        this.addStep(
          `Přidat epsilon pravidlo pro ${nodeSymbol}: ${nodeSymbol} → ε`,
          node,
          `Proměnná ${node.value}[1] generuje prázdný řetězec`
        );
      } else {
        // Variable with value 0 generates a terminal (no production from the terminal itself)
        const terminal = `${node.value}_0`;
        this.grammar.setProductions(nodeSymbol, [[terminal]]);
        this.addStep(
          `Přidat pravidlo pro ${nodeSymbol}: ${nodeSymbol} → ${terminal}`,
          node,
          `Proměnná ${node.value}[0] generuje terminál ${terminal}, který nemá další odvození`
        );
      }
      return;
    }

    // Handle operation nodes
    const childSymbols = node.children
      .map(child => this.getProductionSymbolForChild(child))
      .filter(Boolean);

    if (node.value === "A") { // AND node
      this.grammar.setProductions(nodeSymbol, [childSymbols]);
      this.addStep(
        `Přidat AND pravidlo pro ${nodeSymbol}: ${nodeSymbol} → ${childSymbols.join(' ')}`,
        node,
        `AND uzel ${nodeSymbol} vyžaduje všechny potomky: ${childSymbols.join(' ')}`
      );
    } else if (node.value === "O") { // OR node
      this.grammar.setProductions(nodeSymbol, childSymbols.map(symbol => [symbol]));
      this.addStep(
        `Přidat OR pravidla pro ${nodeSymbol}: ${childSymbols.map(symbol => 
          `${nodeSymbol} → ${symbol}`).join(', ')}`,
        node,
        `OR uzel ${nodeSymbol} má alternativní pravidla pro každého potomka`
      );
    }

    // Process children
    node.children.forEach(child => this.createProductionsRecursively(child));
  }

  getProductionSymbolForChild(child) {
    return this.symbolGenerator.getSymbol(child);
  }
}

/**
 * Component that converts an MCVP problem to a Context-Free Grammar
 * and visualizes each step of the conversion process.
 */
export default function MCVPtoGrammarConverter({ mcvpTree, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Generate conversion steps using useMemo for performance
  const steps = useMemo(() => {
    if (!mcvpTree) return [];
    const converter = new MCVPToGrammarConverter(mcvpTree);
    return converter.convert();
  }, [mcvpTree]);

  // Reset step when tree changes
  useEffect(() => {
    setCurrentStep(0);
  }, [mcvpTree]);

  // Get final grammar
  const finalGrammar = useMemo(() => {
    return steps.length > 0 ? steps[steps.length - 1].grammar : null;
  }, [steps]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRedirect = () => {
    if (onNavigate && finalGrammar) {
      onNavigate('Grammar', finalGrammar);
    }
  };

  // Render the current step
  const renderCurrentStep = () => {
    if (!steps.length || currentStep < 0 || currentStep >= steps.length) {
      return <p>Žádné kroky konverze nejsou k dispozici.</p>;
    }

    const step = steps[currentStep];
    
    return (
      <div className="conversion-step">
        <h3>Krok {currentStep + 1} z {steps.length}</h3>
        <p className="description">{step.description}</p>
        <div className="visualizations">
          <div className="col-md-7">
            <h4>MCVP</h4>
            <div>
              <TreeRenderCanvas 
                tree={mcvpTree} 
                highlightedNode={step.mcvpHighlight}
                activeNode={step.mcvpHighlight}
                completedSteps={step.symbols || []}
                fitToScreen={currentStep === steps.length - 1}
              />
            </div>
          </div>
          
          <div className="col-md-5">
            <h4>Gramatika</h4>
            <GrammarDisplay grammar={step.grammar} />
            <div className="visual-note">
              <p><em>{step.visualNote}</em></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mcvp-to-grammar-converter">
      <h2>MCVP {String.fromCharCode(8594)} Gramatika</h2>

      {renderCurrentStep()}
      
      <NavigationControls 
        currentStep={currentStep}
        totalSteps={steps.length}
        onPrevious={goToPreviousStep}
        onNext={goToNextStep}
      />
      
      {finalGrammar && (
        <div className="d-flex justify-content-center flex-column align-items-center">
            <QuickNavigationControls 
            onGoToStart={() => setCurrentStep(0)}
            onGoToEnd={() => setCurrentStep(steps.length - 1)}
            />
            <button className="btn btn-success btn-lg mt-2" onClick={handleRedirect}>
                Otevřít v Gramatice
            </button>
        </div>
      )}
    </div>
  );
}

MCVPtoGrammarConverter.propTypes = {
  mcvpTree: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    varValue: PropTypes.number,
    children: PropTypes.array
  }),
  onNavigate: PropTypes.func
};

/**
 * Component for displaying grammar in a formatted way
 */
function GrammarDisplay({ grammar }) {
  return (
    <div className="grammar-display">
      <p><strong>Neterminály:</strong> {grammar.nonTerminals.join(', ')}</p>
      <p><strong>Terminály:</strong> {grammar.terminals.join(', ')}</p>
      <p><strong>Počáteční symbol:</strong> {grammar.startSymbol}</p>
      <div className="productions">
        <p><strong>Pravidla:</strong></p>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {Object.entries(grammar.productions).map(([nt, prods]) => (
            <li key={nt}>
              {nt} → {prods.map(p => Array.isArray(p) ? p.join(' ') : p).join(' | ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

GrammarDisplay.propTypes = {
  grammar: PropTypes.shape({
    nonTerminals: PropTypes.array.isRequired,
    terminals: PropTypes.array.isRequired,
    startSymbol: PropTypes.string.isRequired,
    productions: PropTypes.object.isRequired
  }).isRequired
};

/**
 * Component for step navigation controls
 */
function NavigationControls({ currentStep, totalSteps, onPrevious, onNext }) {
  return (
    <div className="navigation-controls">
      <button 
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="btn btn-secondary"
      >
        Předchozí krok
      </button>
      
      <button 
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
        className="btn btn-primary ml-2"
      >
        Další krok
      </button>
    </div>
  );
}

NavigationControls.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

/**
 * Component for quick navigation controls
 */
function QuickNavigationControls({ onGoToStart, onGoToEnd }) {
  return (
    <div className="quick-navigation my-4 d-flex justify-content-center gap-3">
      <button 
        onClick={onGoToStart}
        className="btn btn-outline-secondary"
      >
        ⏮️ Jít na začátek
      </button>
      
      <button 
        onClick={onGoToEnd}
        className="btn btn-outline-primary"
      >
        Jít na konec ⏭️
      </button>
    </div>
  );
}

QuickNavigationControls.propTypes = {
  onGoToStart: PropTypes.func.isRequired,
  onGoToEnd: PropTypes.func.isRequired
};

/**
 * Component for displaying the final converted grammar
 */
function FinalGrammarDisplay({ grammar }) {
  return (
    <div className="conversion-result mt-4 d-flex justify-content-center">
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <h3 className="text-center">Výsledná gramatika</h3>
        <div className="final-grammar-container p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '10px' }}>
          <div className="mb-3">
            <strong>Neterminály:</strong> {grammar.nonTerminals.join(', ')}
          </div>
          
          <div className="mb-3">
            <strong>Terminály:</strong> {grammar.terminals.join(', ')}
          </div>
          
          <div className="mb-3">
            <strong>Počáteční symbol:</strong> {grammar.startSymbol}
          </div>
          
          <div>
            <strong>Pravidla:</strong>
            <div className="mt-2">
              {Object.entries(grammar.productions).map(([nt, prods]) => (
                <div key={nt} className="mb-1" style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  {nt} → {prods.map(p => Array.isArray(p) ? p.join(' ') : p).join(' | ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

FinalGrammarDisplay.propTypes = {
  grammar: PropTypes.shape({
    nonTerminals: PropTypes.array.isRequired,
    terminals: PropTypes.array.isRequired,
    startSymbol: PropTypes.string.isRequired,
    productions: PropTypes.object.isRequired
  }).isRequired
};