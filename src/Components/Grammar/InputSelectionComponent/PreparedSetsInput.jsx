import PropTypes from 'prop-types';
import { Grammar } from '../Utils/Grammar';

// Load all JSON files from the Sady/Grammar directory
const modules = import.meta.glob('../../../../Sady/Grammar/*.json', { eager: true });
const Data = Object.values(modules).map(mod => mod.default || mod);

export function PreparedSetsInput({ onGrammar }) {
  const handleSelectChange = (event) => {
    const index = parseInt(event.target.value);
    if (!isNaN(index) && index >= 0) {
      const selectedGrammar = new Grammar(Data[index]);
      
      onGrammar(selectedGrammar);
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat gramatiku:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {Data.map((grammar, index) => (
          <option key={index} value={index}>
            {grammar.name}
          </option>
        ))}
      </select>
    </div>
  );
}

PreparedSetsInput.propTypes = {
    onGrammar: PropTypes.func.isRequired
};