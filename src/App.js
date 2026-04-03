import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./styles/Layouts";
import Orb from "./Components/Orb/Orb";
import Navigation from "./Components/Navigation/Navigation";
import TopNavbar from "./Components/Top Navbar/TopNavbar";
import Dashboard from "./Components/Dashboard/Dashboard";
import Income from "./Components/Dashboard/Income/Income";
import Expenses from "./Components/Dashboard/Expenses/Expenses";
import ViewData from "./Components/Dashboard/View Data/ViewData";
import InputItem from "./Components/Add Item/InputItem";
import Profile from "./Components/Dashboard/Profile/Profile";
import Login from "./Pages/Login";
import ManageUsers from "./Components/Dashboard/Manage User/ManageUsers";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { useGlobalContext } from "./context/globalContext";

function App() {
    const { user, getIncomes, getExpenses, getItems } = useGlobalContext();

    useEffect(() => {
        if (user) {
            getIncomes();
            getExpenses();
            getItems();
        }
    }, [user]);

    const orbMemo = useMemo(() => <Orb />, []);

    return (
        <Router>
            <AppStyled>
                <Routes>
                    <Route path="/login" element={
                        user ? <Navigate to="/dashboard" replace /> : <Login />
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><Dashboard /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/income" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><Income /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/expenses" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><Expenses /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/view-data" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><ViewData /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/input-item" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><InputItem /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <AppLayout orb={orbMemo}><Profile /></AppLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/manage-users" element={
                        <ProtectedRoute>
                            <RoleRoute allowedRole="owner">
                                <AppLayout orb={orbMemo}><ManageUsers /></AppLayout>
                            </RoleRoute>
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AppStyled>
        </Router>
    );
}

function AppLayout({ orb, children }) {
    return (
        <>
            {orb}
            <MainLayout>
                <Navigation />
                <ContentArea>
                    <TopNavbar />
                    <main>
                        {children}
                    </main>
                </ContentArea>
            </MainLayout>
        </>
    );
}

const AppStyled = styled.div`
    min-height: 100dvh;
    overflow-x: hidden;
`;

const ContentArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-y: auto;
    padding: 1.5rem 1.5rem 1.5rem 0;
    box-sizing: border-box;

    main {
        flex: 1;
    }
`;

export default App;