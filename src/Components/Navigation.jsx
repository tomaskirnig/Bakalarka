import React from 'react';

export function Navigation({ selectedOption, onNavSelect }) {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-3">

            {/* Toggle button for offcanvas sidebar (visible only on mobile) */}
            <button
                className="navbar-toggler d-lg-none" // Show only on small screens
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasNavbar"
                aria-controls="offcanvasNavbar"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            {/* Regular navbar menu for desktop (hidden on mobile) */}
            <div className="collapse navbar-collapse d-none d-lg-flex" id="navbarNav">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <button
                            className={'nav-link ' + (selectedOption === 'Home' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('Home')}
                        >
                            Domů
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={'nav-link ' + (selectedOption === 'MCVP' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('MCVP')}
                        >
                            MCVP
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={'nav-link ' + (selectedOption === 'CombinatorialGame' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('CombinatorialGame')}
                        >
                            Kombinatorická hra
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={'nav-link ' + (selectedOption === 'Other' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('Other')}
                        >
                            Další
                        </button>
                    </li>
                </ul>
            </div>

            {/* Offcanvas sidebar for mobile (hidden on desktop) */}
            <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <button
                                className={'nav-link ' + (selectedOption === 'Home' ? 'active' : '') + ' fs-5'}
                                onClick={() => onNavSelect('Home')}
                                data-bs-dismiss="offcanvas" // Close sidebar on click
                            >
                                Home
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={'nav-link ' + (selectedOption === 'MCVP' ? 'active' : '') + ' fs-5'}
                                onClick={() => onNavSelect('MCVP')}
                                data-bs-dismiss="offcanvas" // Close sidebar on click
                            >
                                MCVP
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={'nav-link ' + (selectedOption === 'Other' ? 'active' : '') + ' fs-5'}
                                onClick={() => onNavSelect('Other')}
                                data-bs-dismiss="offcanvas" // Close sidebar on click
                            >
                                Other
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}