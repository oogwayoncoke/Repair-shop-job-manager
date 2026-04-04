import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";

function ProtectedRoute({ children, requiredRole, requiredLevel }) {
  const isDemo = localStorage.getItem("demo_mode") === "true";
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    setIsAuthorized(!!token);
  }, []);

  if (isAuthorized === null) return null;

  const token = localStorage.getItem(ACCESS_TOKEN);
  if (!token) return <Navigate to="/login" />;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch {
    return <Navigate to="/login" />;
  }

  let userRole = decoded.role;
  if (userRole === "TECHNICIAN") userRole = "TECH";
  const userLevel =
    decoded.tech_level || decoded.techlevel || decoded.tech_Rank;

  if (requiredRole && userRole !== requiredRole) {
    return isDemo ? <Navigate to="/demo" /> : <Navigate to="/" />;
  }

  if (requiredLevel && userLevel !== requiredLevel) {
    return isDemo ? <Navigate to="/demo" /> : <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;