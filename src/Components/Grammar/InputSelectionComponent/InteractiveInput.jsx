import React, { useState, useRef } from 'react';

export function TreeBuilderCanvas({ onGrammar }) {
  const [rules, setRules] = useState([{ left: 'S', right: '' }]);
  const [grammarName, setGrammarName] = useState('');
  const [terminals, setTerminals] = useState(['a', 'b']);
  const [nonTerminals, setNonTerminals] = useState(['S', 'A', 'B']);
  
  // Add a new rule
  const addRule = () => {
    setRules([...rules, { left: 'S', right: '' }]);
  };

  // Remove a rule
  const removeRule = (index) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    setRules(newRules);
  };

  // Update a rule
  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  // Add a terminal
  const addTerminal = () => {
    // Default to the next letter in the alphabet after the last one
    const lastTerminal = terminals[terminals.length - 1] || 'a';
    const nextChar = String.fromCharCode(lastTerminal.charCodeAt(0) + 1);
    setTerminals([...terminals, nextChar]);
  };

  // Add a non-terminal
  const addNonTerminal = () => {
    // Default to the next letter in the alphabet after the last one
    const lastNonTerminal = nonTerminals[nonTerminals.length - 1] || 'A';
    const nextChar = String.fromCharCode(lastNonTerminal.charCodeAt(0) + 1);
    setNonTerminals([...nonTerminals, nextChar]);
  };

  // Process and submit the grammar
  const handleCreateGrammar = () => {
    // Convert rules to string format
    const grammarText = rules.map(rule => 
      `${rule.left} → ${rule.right}`
    ).join('\n');
    
    const parsedGrammar = {
      rules: rules,
      terminals: terminals,
      nonTerminals: nonTerminals,
      input: grammarText,
      name: grammarName || 'Custom Grammar'
    };
    
    onGrammar(parsedGrammar);
  };

  return (
    <div className="inputWindow">
      <h2>Interaktivní tvorba gramatiky</h2>
      
      <div className="mb-3">
        <label className="form-label">Název gramatiky:</label>
        <input 
          type="text" 
          className="form-control" 
          value={grammarName}
          onChange={(e) => setGrammarName(e.target.value)}
          placeholder="Volitelný název"
        />
      </div>

      <div className="mb-3">
        <h4>Terminály</h4>
        <div className="d-flex flex-wrap mb-2">
          {terminals.map((terminal, index) => (
            <span key={index} className="badge bg-secondary m-1">{terminal}</span>
          ))}
          <button className="btn btn-sm btn-outline-light m-1" onClick={addTerminal}>+</button>
        </div>
        
        <h4>Neterminály</h4>
        <div className="d-flex flex-wrap mb-2">
          {nonTerminals.map((nonTerminal, index) => (
            <span key={index} className="badge bg-primary m-1">{nonTerminal}</span>
          ))}
          <button className="btn btn-sm btn-outline-light m-1" onClick={addNonTerminal}>+</button>
        </div>
      </div>

      <h4>Pravidla</h4>
      {rules.map((rule, index) => (
        <div key={index} className="input-group mb-2">
          <select 
            className="form-select" 
            value={rule.left}
            onChange={(e) => updateRule(index, 'left', e.target.value)}
          >
            {nonTerminals.map(nt => (
              <option key={nt} value={nt}>{nt}</option>
            ))}
          </select>
          <span className="input-group-text">→</span>
          <input 
            type="text" 
            className="form-control"
            value={rule.right}
            onChange={(e) => updateRule(index, 'right', e.target.value)}
            placeholder="např. aB | bS | ε"
          />
          <button 
            className="btn btn-outline-danger" 
            onClick={() => removeRule(index)}
          >
            X
          </button>
        </div>
      ))}
      
      <div className="d-grid gap-2">
        <button className="btn btn-outline-light" onClick={addRule}>Přidat pravidlo</button>
        <button className="btn btn-primary" onClick={handleCreateGrammar}>Vytvořit gramatiku</button>
      </div>
    </div>
  );
}