import PropTypes from 'prop-types';

export function GameAnalysisDisplay({ analysisResult }) {
    return (
        <div className="card mt-4 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
            <div className="card-header bg-light fw-bold text-center">
                Analýza hry
            </div>
            <div className="card-body text-center">
                {analysisResult ? (
                    <>
                        <div className={`alert ${analysisResult.hasWinningStrategy ? 'alert-success' : 'alert-warning'}`}>
                            {analysisResult.message}
                        </div>
                        <p className="text-muted small mb-0">
                            Zlatě vyznačené hrany představují optimální tahy pro Hráče I.
                        </p>
                    </>
                ) : (
                    <p className="text-muted">Probíhá analýza...</p>
                )}
            </div>
        </div>
    );
}

GameAnalysisDisplay.propTypes = {
    analysisResult: PropTypes.shape({
        hasWinningStrategy: PropTypes.bool,
        message: PropTypes.string
    })
};
