import { Navigate } from "react-router-dom";
import { useGlobalContext } from "../context/globalContext";

function RoleRoute({ children, allowedRole }) {
    const { user } = useGlobalContext();

    if (!user || user.role !== allowedRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default RoleRoute;