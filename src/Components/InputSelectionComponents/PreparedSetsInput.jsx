import FileLoader from './FileLoader';

export function PreparedSetsInput() {
    return (
      <div className="inputWindow">
        <label>Vybrat sadu:</label>
        <select>
          <option value="">Vybrat sadu</option>
          {/* Add more options here */}
        </select>
        <div className="confirmInputDiv">
            <button type="button" className="btn btn-outline-primary">Potvrdit</button>
        </div>
      </div>
    );
  }
  