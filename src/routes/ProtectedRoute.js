import { Navigate } from "react-router-dom";
import { useGlobalContext } from "../context/globalContext";

function ProtectedRoute({ children }) {
    const { user } = useGlobalContext();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;