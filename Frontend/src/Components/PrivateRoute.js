import { Navigate } from "react-router-dom";

function PrivateRoute({ children, role }) {

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // 🔍 Debug (keep temporarily)
  console.log("Token:", token);
  console.log("Stored Role:", userRole);
  console.log("Required Role:", role);

  if (!token) {
    return <Navigate to="/" />;
  }

  // ✅ FIX: normalize role
  if (role && userRole?.trim().toUpperCase() !== role.toUpperCase()) {
    return <Navigate to="/" />;
  }

  return children;
}

export default PrivateRoute;