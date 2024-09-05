

import { Navigate } from 'react-router-dom';
import PropTypes from "prop-types"

const ProtectedRoute = ({ children }) => {
    const isAuthenticated  = localStorage.getItem('token') ;
    console.log('isAuthenticated:', isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/auth" replace />;
  };

  ProtectedRoute.propTypes = {
    children: PropTypes.node
  }

export default ProtectedRoute;