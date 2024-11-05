// import FileLoader from './FileLoader';

export function PreparedSetsInput( {onTreeUpdate} ) {
    return (
      <div className="inputWindow">
        <label>Vybrat sadu:</label>
        <select className="form-select">
          <option value="">Vybrat sadu</option>
          {/* Add more options here */}
        </select>
        <div className="confirmInputDiv">
            <button className='btn btn-primary' type="button">Potvrdit</button>
        </div>
      </div>
    );
  }
  