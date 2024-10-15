import React, { useState } from 'react';

export function Navigation({ selectedOption, onNavSelect }) {

    return (
        <nav className='navbar navbar-expand-lg navbar-light bg-light py-3'>
            <button
                className='navbar-toggler'
                type='button'
                data-toggle='collapse'
                data-target='#navbarNav'
                aria-controls='navbarNav'
                aria-expanded='false'
                aria-label='Toggle navigation'>
                    <span className='navbar-toggler-icon'></span>
            </button>
            <div className='collapse navbar-collapse' id='navbarNav'>
                <ul className='navbar-nav'>
                    <li className='nav-item'>
                        <button className={'nav-link ' + (selectedOption === 'Home' ? 'active' : '') + ' fs-5'} 
                                onClick={() => onNavSelect('Home')}> 
                                Home
                        </button>
                    </li>
                    <li className='nav-item'>
                        <button className={'nav-link ' + (selectedOption === 'MCVP' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('MCVP')}>
                            MCVP
                        </button>
                    </li>
                    <li className='nav-item'>
                        <button className={'nav-link ' + (selectedOption === 'Other' ? 'active' : '') + ' fs-5'}
                            onClick={() => onNavSelect('Other')}>
                            Other
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    )
}
