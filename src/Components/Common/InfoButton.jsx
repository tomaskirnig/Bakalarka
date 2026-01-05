import { useState } from 'react';
import PropTypes from 'prop-types';

export function InfoButton({ title, children }) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div 
      className='legend position-absolute'
      style={{ zIndex: 1050, cursor: 'help', top: '104px', right: '20px' }}
      onMouseEnter={() => setShowLegend(true)}
      onMouseLeave={() => setShowLegend(false)}
    >
      <div 
        className="d-flex justify-content-center align-items-center rounded-circle bg-light border" 
        style={{ width: '24px', height: '24px', fontSize: '14px', fontWeight: 'bold', color: '#666' }}
      >
        i
      </div>
      {showLegend && (
        <div 
          className="legend-bubble position-absolute bg-white p-3 shadow rounded border"
          style={{ right: '0', top: '30px', width: '300px', zIndex: 1060 }}
        >
          {title && <h6 className="mb-2">{title}</h6>}
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

InfoButton.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired
};
