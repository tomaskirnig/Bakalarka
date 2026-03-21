import PropTypes from 'prop-types';

/**
 * Generic tab-like selector that switches between alternative input modes.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Input mode selector and content container.
 */
export function GenericInputMethodSelector({
  selectedOption,
  onOptionSelect,
  options,
  renderContent,
}) {
  return (
    <>
      <div className="tabs mb-3">
        {options.map((opt) => (
          <div key={opt.value} className="d-inline-block">
            <input
              type="radio"
              className="btn-check"
              name="input-method-selector"
              id={`btnradio-${opt.value}`}
              autoComplete="off"
              checked={selectedOption === opt.value}
              onChange={() => onOptionSelect(opt.value)}
            />
            <label className="btn btn-outline-primary" htmlFor={`btnradio-${opt.value}`}>
              {opt.label}
            </label>
          </div>
        ))}
      </div>

      <div className="input-block">{renderContent(selectedOption)}</div>
    </>
  );
}

GenericInputMethodSelector.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  onOptionSelect: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  renderContent: PropTypes.func.isRequired,
};
