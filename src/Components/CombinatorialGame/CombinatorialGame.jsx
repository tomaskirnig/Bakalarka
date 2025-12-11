import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { DisplayGraph } from './Utils/DisplayGraph';
import { InfoButton } from '../Common/InfoButton';

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
        <div className='container text-center py-4 position-relative'>
            <InfoButton title="Kombinatorická hra na grafu">
                <p>
                    Jedná se o nestrannou hru pro dva hráče hranou na konečném orientovaném acyklickém grafu.
                </p>
                <ul className="ps-3 text-start">
                    <li><strong>Hráči:</strong> Hráč I (začíná) a Hráč II.</li>
                    <li><strong>Pravidla:</strong> Hráči se střídají v tazích. V každém tahu hráč přesune žeton z aktuálního vrcholu do jednoho z jeho následníků.</li>
                    <li><strong>Konec hry:</strong> Prohrává hráč, který nemůže provést tah (nachází se v listu).</li>
                    <li><strong>Cíl:</strong> Určit, zda má Hráč I vyhrávající strategii (tj. dokáže vynutit výhru bez ohledu na tahy soupeře).</li>
                </ul>
            </InfoButton>

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

            {/* {graph && (
                <div className="d-flex justify-content-center gap-3 my-4">
                    <button className='btn-control'>Převést na MCVP</button>
                    <button className='btn-control'>Převést na Kombinatorickou hru</button>
                </div>
            )} */}
        </div>  
    );
}

CombinatorialGame.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};

export default CombinatorialGame;