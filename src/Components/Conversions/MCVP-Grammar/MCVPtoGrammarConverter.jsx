import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TreeRenderCanvas } from '../../MCVP/TreeRenderCanvas';
import ConversionGrammar from './ConversionGrammar';

/**
 * Generates non-terminal symbols using A-Z, AA-ZZ naming convention
 */
class NonTerminalGenerator {
  constructor() {
    this.currentCode = 65; // ASCII for 'A'
    this.nodeMap = new Map();
    this.generatedSymbols = new Set(['S']); // S is reserved for start
  }

  /**
   * Generates the next unique non-terminal symbol
   */
  generateNextSymbol() {
    let symbol;
    do {
      if (this.currentCode <= 90) { // A-Z
        symbol = String.fromCharCode(this.currentCode);
      } else {
         // Generate AA, AB, etc.
         const index = this.currentCode - 91; 
         const firstChar = Math.floor(index / 26);
         const secondChar = index % 26;
         symbol = String.fromCharCode(65 + firstChar) + String.fromCharCode(65 + secondChar);
      }
      this.currentCode++;
    } while (this.generatedSymbols.has(symbol) || symbol === 'S'); // Skip if already exists or is S

    this.generatedSymbols.add(symbol);
    return symbol;
  }

  getSymbolForNode(node, startSymbol = null) {
    if (this.nodeMap.has(node)) {
      return this.nodeMap.get(node);
    }

    let symbol;
    if (startSymbol) {
      symbol = startSymbol;
      this.generatedSymbols.add(symbol);
    } else {
      symbol = this.generateNextSymbol();
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
 * Generates terminal symbols using a-z, then special characters
 */
class TerminalGenerator {
  constructor() {
    this.terminals = 'abcdefghijklmnopqrstuvwxyz+-=*#@$%&!?<>[]{}()'.split('');
    this.currentIndex = 0;
    this.variableMap = new Map();
  }

  /**
   * Gets or generates a terminal for a variable node
   */
  getTerminalForVariable(variable) {
    if (this.variableMap.has(variable)) {
      return this.variableMap.get(variable);
    }

    if (this.currentIndex >= this.terminals.length) {
      // If we run out of symbols, generate numbered terminals
      const terminal = `t${this.currentIndex - this.terminals.length + 1}`;
      this.variableMap.set(variable, terminal);
      this.currentIndex++;
      return terminal;
    }

    const terminal = this.terminals[this.currentIndex];
    this.variableMap.set(variable, terminal);
    this.currentIndex++;
    return terminal;
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
    this.terminalGenerator = new TerminalGenerator();
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
      description: "Inicializace gramatiky",
      mcvpHighlight: null,
      grammar: this.grammar.serialize(),
      visualNote: `Inicializace: Počáteční symbol S. Proměnné s hodnotou 1 budou nahrazeny unikátními terminály (a-z, +, -, atd.), proměnné s hodnotou 0 vytvoří prázdnou produkci (ε).`,
      symbols: this.symbolGenerator.getAllSymbols()
    });
  }

  addFinalStep() {
    this.steps.push({
      description: "Konverze dokončena",
      mcvpHighlight: null,
      grammar: this.grammar.serialize(),
      visualNote: "MCVP byl úspěšně převeden na bezkontextovou gramatiku. Každá proměnná s hodnotou 1 má unikátní terminál, proměnné s hodnotou 0 vytváří prázdné produkce (ε).",
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

    // If node is a variable AND NOT the root, we don't create a non-terminal for it.
    // It will be replaced directly by a terminal or epsilon in parent's rule.
    const isRoot = node === this.mcvpTree;
    if (node.type === "variable" && !isRoot) {
      return;
    }

    const nodeSymbol = this.symbolGenerator.getSymbolForNode(node);
    this.grammar.addNonTerminal(nodeSymbol);

    const nodeTypeDisplay = node.type === "operation" 
      ? (node.value === "A" ? "AND" : "OR") 
      : `proměnná ${node.value}`;
    
    this.addStep(
      `Vytvořit neterminál ${nodeSymbol}`,
      node,
      `Pro uzel ${nodeTypeDisplay} byl vytvořen neterminál ${nodeSymbol}.`
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

    // If variable and NOT root, we don't create productions for it (it has no NT)
    const isRoot = node === this.mcvpTree;
    if (node.type === "variable" && !isRoot) return;

    const nodeSymbol = this.symbolGenerator.getSymbol(node); // Should be 'S' if root variable, or NT for op
    if (!nodeSymbol) return;

    // Handle variable nodes (Only if Root)
    if (node.type === "variable") {
      if (node.varValue === 1) {
        const terminal = this.terminalGenerator.getTerminalForVariable(node);
        this.grammar.addTerminal(terminal);
        this.grammar.setProductions(nodeSymbol, [[terminal]]);
        this.addStep(
          `Pravidlo pro kořen: ${nodeSymbol} → ${terminal}`,
          node,
          `Kořen je proměnná s hodnotou 1, generuje terminál '${terminal}'.`
        );
      } else {
        this.grammar.setProductions(nodeSymbol, [[]]);
        this.addStep(
          `Pravidlo pro kořen: ${nodeSymbol} → ε`,
          node,
          `Kořen je proměnná s hodnotou 0, generuje prázdnou produkci (ε).`
        );
      }
      return;
    }

    // Handle operation nodes
    if (node.value === "A") { // AND node
      // For AND: filter out nulls (epsilon children contribute nothing to concatenation)
      const childSymbols = node.children
        .filter(child => child != null)
        .map(child => this.getProductionSymbolForChild(child))
        .filter(Boolean);
      
      this.grammar.setProductions(nodeSymbol, [childSymbols]);
      const rightSide = childSymbols.length > 0 ? childSymbols.join(' ') : 'ε';
      this.addStep(
        `Přidat AND pravidlo: ${nodeSymbol} → ${rightSide}`,
        node,
        `AND uzel: zřetězení symbolů potomků.`
      );
    } else if (node.value === "O") { // OR node
      // For OR: keep nulls to create epsilon productions
      const childSymbolsOrNull = node.children
        .filter(child => child != null)
        .map(child => this.getProductionSymbolForChild(child));
      
      // Create production for each child: null becomes [], others become [symbol]
      const productions = childSymbolsOrNull.map(symbol => symbol === null ? [] : [symbol]);
      this.grammar.setProductions(nodeSymbol, productions);
      
      const rules = childSymbolsOrNull.map((s) => {
        const rhs = s === null ? 'ε' : s;
        return `${nodeSymbol} → ${rhs}`;
      }).join(', ');
      
      this.addStep(
        `Přidat OR pravidla: ${rules}`,
        node,
        `OR uzel: alternativní pravidla pro potomky.`
      );
    }

    // Process children
    node.children.forEach(child => {
      if (child) {
        this.createProductionsRecursively(child);
      }
    });
  }

  getProductionSymbolForChild(child) {
    if (!child) {
      console.warn('getProductionSymbolForChild called with null/undefined child');
      return null;
    }
    if (child.type === "variable") {
      if (child.varValue === 1) {
        const terminal = this.terminalGenerator.getTerminalForVariable(child);
        this.grammar.addTerminal(terminal);
        return terminal;
      } else {
        // Variable with value 0 contributes nothing (epsilon)
        return null;
      }
    }
    return this.symbolGenerator.getSymbol(child);
  }
}

/**
 * Component that converts an MCVP problem to a Context-Free Grammar
 * and visualizes each step of the conversion process.
 */
export default function MCVPtoGrammarConverter({ mcvpTree, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fitTrigger, setFitTrigger] = useState(0);

  // Generate conversion steps using useMemo for performance
  const steps = useMemo(() => {
    if (!mcvpTree) return [];
    const converter = new MCVPToGrammarConverter(mcvpTree);
    return converter.convert();
  }, [mcvpTree]);

  // Reset step when tree changes
  useEffect(() => {
    setCurrentStep(0);
    setFitTrigger(prev => prev + 1);
  }, [mcvpTree]);

  // Trigger fit when reaching the last step
  useEffect(() => {
    if (currentStep === steps.length - 1 && steps.length > 0) {
      setFitTrigger(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

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

  const skipToStart = () => {
    setCurrentStep(0);
    setFitTrigger(prev => prev + 1);
  };

  const skipToEnd = () => {
    setCurrentStep(steps.length - 1);
    setFitTrigger(prev => prev + 1);
  };

  // Render the current step
  const renderCurrentStep = () => {
    if (!steps.length || currentStep < 0 || currentStep >= steps.length) {
      return <p>Žádné kroky konverze nejsou k dispozici.</p>;
    }

    const step = steps[currentStep];
    
    return (
      <div className="conversion-step d-flex flex-column pb-2">
        <h3 className="text-center mb-1">Krok {currentStep + 1} z {steps.length}</h3>
        <p className="description text-center mb-2 small">{step.description}</p>
        <div className="row gx-2" style={{ minHeight: 0, margin: 0 }}>
          <div className="col-md-7 d-flex flex-column" style={{ minHeight: 0 }}>
            <h4 className="text-center mb-1">MCVP</h4>
            <div className="bg-light" style={{ borderRadius: '4px', overflow: 'hidden', height: '49vh' }}>
              <TreeRenderCanvas 
                tree={mcvpTree} 
                highlightedNode={step.mcvpHighlight}
                activeNode={step.mcvpHighlight}
                completedSteps={step.symbols || []}
                fitToScreen={false}
                fitTrigger={fitTrigger}
              />
            </div>
          </div>
          
          <div className="col-md-5 d-flex flex-column" style={{ minHeight: 0 }}>
            <h4 className="text-center mb-1">Gramatika</h4>
            <div className="bg-light p-2" style={{ overflow: 'auto', height: '49vh', borderRadius: '4px' }}>
              <GrammarDisplay grammar={step.grammar} />
              <div className="mt-2 p-2 bg-white rounded">
                <p className="mb-0 small"><em>{step.visualNote}</em></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      <h2 className="text-center mb-2" style={{ flexShrink: 0 }}>MCVP {String.fromCharCode(8594)} Gramatika</h2>

      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: 'hidden' }}>
        {renderCurrentStep()}
      </div>
      
      <div className="mt-2" style={{ flexShrink: 0 }}>
        <div className="d-flex justify-content-center gap-2 mb-2">
          <button 
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className="btn btn-secondary"
          >
            Předchozí
          </button>
          
          <button 
            onClick={goToNextStep}
            disabled={currentStep === steps.length - 1}
            className="btn btn-primary"
          >
            Další
          </button>
        </div>
        
        {finalGrammar && (
          <div className="d-flex justify-content-center flex-wrap align-items-center gap-2">
              <button 
                onClick={skipToStart}
                disabled={currentStep === 0}
                className="btn btn-outline-secondary btn-sm"
              >
                ⏮️ Jít na začátek
              </button>
              
              <button 
                onClick={skipToEnd}
                disabled={currentStep === steps.length - 1}
                className="btn btn-outline-primary btn-sm"
              >
                Jít na konec ⏭️
              </button>
              <button className="btn btn-success" onClick={handleRedirect}>
                  Otevřít v Gramatice
              </button>
          </div>
        )}
      </div>
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
  // Helper function to format a production - show 'ε' for empty productions
  const formatProduction = (prod) => {
    if (!Array.isArray(prod)) return String(prod);
    if (prod.length === 0) return 'ε';
    return prod.join(' ');
  };

  return (
    <div className="grammar-display">
      <p><strong>Neterminály:</strong> {grammar.nonTerminals.join(', ') || '(žádné)'}</p>
      <p><strong>Terminály:</strong> {grammar.terminals.length > 0 ? grammar.terminals.join(', ') : '(žádné)'}</p>
      <p><strong>Počáteční symbol:</strong> {grammar.startSymbol}</p>
      <div className="productions">
        <p><strong>Pravidla:</strong></p>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {Object.entries(grammar.productions).map(([nt, prods]) => {
            const formattedProductions = prods.map(formatProduction);
            const rightSide = formattedProductions.join(' | ');
            return (
              <li key={nt}>
                {nt} → <span style={{ whiteSpace: 'pre' }}>{rightSide}</span>
              </li>
            );
          })}
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