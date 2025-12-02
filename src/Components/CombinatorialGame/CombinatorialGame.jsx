import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { DisplayGraph } from './Utils/DisplayGraph';

export function CombinatorialGame({ onNavigate, initialData }) {
    const [graph, setGraph] = useState(null); // Current tree
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    
    // Handle initial data if provided
    useEffect(() => {
        if (initialData) {
            setGraph(initialData);
        }
    }, [initialData]);

    const handleOptionChange = (option) => {
        setChosenOpt(option);
        setGraph(null);
    };

    return(
        <div className='container text-center py-4'>
            <h1 className='display-4 mb-4'>Kombinatorická hra</h1>
            <GenericInputMethodSelector
                selectedOption={chosenOpt}
                onOptionSelect={handleOptionChange}
                options={[
                    { value: 'manual', label: 'Manuálně' },
                    { value: 'generate', label: 'Generovat' },
                    { value: 'sets', label: 'Načíst ze sady' }
                ]}
                renderContent={(opt) => {
                    switch (opt) {
                        case 'manual': return <ManualInput initialGraph={graph} onGraphUpdate={setGraph} />;
                        case 'generate': return <GenerateInput onGraphUpdate={setGraph} />;
                        case 'sets': return <PreparedSetsInput onGraphUpdate={setGraph} />;
                        default: return null;
                    }
                }}
            />

            {(graph && chosenOpt !== 'manual') && <DisplayGraph graph={graph} />}

            {graph && (
                <div className="d-flex justify-content-center gap-3 my-4">
                    <button className='btn-control'>Převést na MCVP</button>
                    <button className='btn-control'>Převést na Kombinatorickou hru</button>
                </div>
            )}
        </div>  
    );
}

CombinatorialGame.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};

export default CombinatorialGame;