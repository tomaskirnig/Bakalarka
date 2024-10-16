export function GenerateInput() {
    return (
      <div className="inputWindow">
        <label>Počet hradel:</label>
        <input type="number" min="1" placeholder="Počet hradel" />
        <label>Počet proměnných:</label>
        <input type="number" min="1" placeholder="Počet proměnných" />
      </div>
    );
  }
  