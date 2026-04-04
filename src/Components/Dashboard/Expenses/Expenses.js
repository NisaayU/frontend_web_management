import React, { useEffect } from "react";
import styled from "styled-components";
import { InnerLayout } from "../../../styles/Layouts";
import { useGlobalContext } from "../../../context/globalContext";
import ExpenseForm from "./ExpenseForm";

function Expenses() {
    const { addExpense, expenses, getExpenses, deleteExpense, totalExpenses } = useGlobalContext();

    useEffect(() => {
        getExpenses()
    }, []);

    return (
        <ExpenseStyled>
            <InnerLayout>
                <h1>Pengeluaran Harian</h1>
                <h2 className="total-expense">Total  <span>Rp {totalExpenses()}</span></h2>
                <div className="expense-content">
                    <div className="form-container">
                        <ExpenseForm />
                    </div>
                    <div className="expense">
                        {expenses.map((income) => {
                            const { _id, title, amount, date, category, description, type } = expenses;
                        })}
                    </div>
                </div>
            </InnerLayout>
        </ExpenseStyled>
    );
}

const ExpenseStyled = styled.div`
display: flex;
overflow: auto;
.total-expense{
    display: flex;
    justify-content: center;
    align-items: center;
    background: #FCF6F9;
    border: 2px solid #FFFFF;
    box-shadow: 0px 1px 15px rgba(0, 0, 0, 0.06);
    border-radius: 20px;
    padding: 1rem;
    margin: 1rem 0;
    font-size: 2rem;
    gap: .5rem;
    span{
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--color-green);
    }
}
.expense-content{
    display: flex;
    gap: 2rem;
    .form-container {
        flex: 1;
        min-width:0;
    }
    .expenses{
        flex: 1;
        min-width: 0;
    }
}
`;

export default Expenses