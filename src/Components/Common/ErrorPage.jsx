import PropTypes from 'prop-types';

/**
 * Full-page fallback UI shown when a fatal render error is caught.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Error fallback page.
 */
function ErrorPage({ error, onReset }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color2) 0%, var(--color3) 100%)',
          borderRadius: '20px',
          padding: '3rem 3.5rem',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(7, 57, 60, 0.35)',
          border: '1px solid rgba(144, 221, 240, 0.2)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(144, 221, 240, 0.15)',
            border: '2px solid var(--color4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem auto',
            fontSize: '2.25rem',
            boxShadow: '0 0 30px rgba(144, 221, 240, 0.2)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="36"
            height="36"
            fill="none"
            stroke="var(--color4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <circle cx="12" cy="17" r="0.5" fill="var(--color4)" />
          </svg>
        </div>

        <h3
          style={{
            color: 'white',
            fontWeight: '700',
            marginBottom: '0.75rem',
            fontSize: '1.4rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Nastala neočekávaná chyba
        </h3>

        {error?.message && (
          <p
            style={{
              color: 'rgba(144, 221, 240, 0.85)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              fontFamily: '"Courier New", monospace',
              background: 'rgba(0,0,0,0.2)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(144, 221, 240, 0.15)',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
        )}

        <button
          className="btn-control"
          onClick={onReset}
          style={{ marginTop: error?.message ? '0' : '0.5rem' }}
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;

ErrorPage.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }),
  onReset: PropTypes.func,
};
