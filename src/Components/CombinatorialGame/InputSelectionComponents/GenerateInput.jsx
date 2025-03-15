import React, { useState } from 'react';

export function GenerateInput({ onGraphUpdate }) {
    const [error, setError] = useState('');

    const handleInputSubmit = () => {
        try {
            const newGraph = generateGraph();
            onGraphUpdate(newGraph);
            setError('');
        } catch (error) {
            setError('Invalid input');
        }
    };

    return (
        <div className="input-block">
            <button className="btn btn-primary" onClick={handleInputSubmit}>
                Generate
            </button>
            <p className="text-danger">{error}</p>
        </div>
    );
}