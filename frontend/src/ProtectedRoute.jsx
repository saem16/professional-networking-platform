import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { clearSession, getSession } from './utils/Session';

const ProtectedRoute = ({ children }) => {
  const token = getSession('token');
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/session`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        clearSession()
        setIsValid(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isValid === null) return <div>Loading...</div>;

  return isValid ? children : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
