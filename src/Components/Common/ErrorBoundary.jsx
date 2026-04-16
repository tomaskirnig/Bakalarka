import { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorPage from './ErrorPage';

/**
 * React error boundary that catches runtime rendering errors
 * and shows a recoverable fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info);
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <ErrorPage error={error} onReset={() => this.setState({ hasError: false, error: null })} />
      );
    }
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
