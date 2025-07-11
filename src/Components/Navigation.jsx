export function Navigation({ selectedOption, onNavSelect }) {
  const navItems = [
    { key: 'Home',       labelDesktop: 'Domů',           labelMobile: 'Home' },
    { key: 'MCVP',       labelDesktop: 'MCVP',           labelMobile: 'MCVP' },
    { key: 'CombinatorialGame', labelDesktop: 'Kombinatorická hra', labelMobile: 'Kombinatorická hra' },
    { key: 'Grammar',    labelDesktop: 'Gramatika',      labelMobile: 'Grammar' },
  ];

  const renderButton = ({ key, label }) => (
    <button
      key={key}
      className={`nav-link fs-5 ${selectedOption === key ? 'active' : ''}`}
      onClick={() => onNavSelect(key)}
      data-bs-dismiss="offcanvas"  // needed on mobile
    >
      {label}
    </button>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light py-3">
      {/* Mobile toggle */}
      <button
        className="navbar-toggler d-lg-none"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasNavbar"
        aria-controls="offcanvasNavbar"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      {/* Desktop menu */}
      <div className="collapse navbar-collapse d-none d-lg-flex" id="navbarNav">
        <ul className="navbar-nav">
          {navItems.map(item => renderButton({ ...item, label: item.labelDesktop }))}
        </ul>
      </div>

      {/* Mobile offcanvas */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex={-1}
        id="offcanvasNavbar"
        aria-labelledby="offcanvasNavbarLabel"
        data-bs-backdrop="true" 
        data-bs-scroll="false"  
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <ul className="navbar-nav">
            {navItems.map(item => renderButton({ ...item, label: item.labelMobile }))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
