import { useId } from 'react';
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
  const groupId = useId();

  return (
    <>
      <div className="tabs mb-3">
        {options.map((opt) => {
          const optionId = `btnradio-${groupId}-${opt.value}`;

          return (
            <div key={opt.value} className="d-inline-block">
              <input
                type="radio"
                className="btn-check"
                name={`input-method-selector-${groupId}`}
                id={optionId}
                autoComplete="off"
                checked={selectedOption === opt.value}
                onChange={() => onOptionSelect(opt.value)}
              />
              <label className="btn btn-outline-primary" htmlFor={optionId}>
                {opt.label}
              </label>
            </div>
          );
        })}
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
