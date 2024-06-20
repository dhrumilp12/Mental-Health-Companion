

import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated  = localStorage.getItem('token') ;
    console.log('isAuthenticated:', isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/auth" replace />;
  };

export default ProtectedRoute;