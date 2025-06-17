/**
 * @fileoverview Provides a function to load MCVP example expressions from a JSON file.
 */

import data from '../../../../Sady/SadyMCVP.json';

/**
 * Retrieves MCVP expression data from the predefined JSON file.
 * @returns {Object} An object containing MCVP expressions, where keys are set names and values are expressions
 */
export function getData() {
    return data;
}

