import React, { useState } from 'react';

export function PreparedSetsInput({ onGraphUpdate }) {
    const [selectedSet, setSelectedSet] = useState('');
    const [error, setError] = useState('');

    const handleInputSubmit = () => {
        try {
            const newGraph = preparedSets[selectedSet]();
            onGraphUpdate(newGraph);
            setError('');
        } catch (error) {
            setError('Invalid input');
        }
    };

    return (
        <div className="input-block">
            <select className="form-select" value={selectedSet} onChange={(event) => setSelectedSet(event.target.value)}>
                <option value="">Vyberte sadu</option>
                {Object.keys(preparedSets).map((set) => (
                    <option key={set} value={set}>
                        {set}
                    </option>
                ))}
            </select>
            <button className="btn btn-primary" onClick={handleInputSubmit}>
                Načíst
            </button>
            <p className="text-danger">{error}</p>
        </div>
    );
}