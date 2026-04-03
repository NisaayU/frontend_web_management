import styled from "styled-components";

export const MainLayout = styled.div`
    padding: 2rem;
    height: 100dvh;
    display: flex;
    gap: 2rem;
    box-sizing: border-box;

    @media (max-width: 768px) {
        flex-direction: column;
        padding: 0.8rem;
    }
`;

export const InnerLayout = styled.div`
    padding: 2rem 1.5rem;
    width: 100%;
`;