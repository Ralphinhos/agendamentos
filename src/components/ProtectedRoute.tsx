import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: ("admin" | "editor")[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    // You can add a loading spinner here
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
