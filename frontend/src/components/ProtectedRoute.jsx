import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const hasToken = isAuthenticated();
  const hasUser = !!localStorage.getItem('user');
  if (!hasToken || !hasUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;

