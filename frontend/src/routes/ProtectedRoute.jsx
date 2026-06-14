import { Navigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function ProtectedRoute({
  children,
  roles
}) {
  const { user, loading } =
    useAuth();

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!user) {
    return (
      <Navigate to="/login" />
    );
  }

  if (
    roles?.length &&
    !roles.includes(user.role)
  ) {
    return (
      <Navigate to="/dashboard" />
    );
  }

  return children;
}

export default ProtectedRoute;
