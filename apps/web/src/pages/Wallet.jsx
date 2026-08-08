import { useEffect, useState } from "react";
import api from "../services/api";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWallet() {
    try {
      setLoading(true);
      setError("");

      const data = await api("/wallet");

      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "خطا در دریافت اطلاعات کیف پول");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  if (loading) {
    return <h3>در حال دریافت اطلاعات کیف پول...</h3>;
  }

  if (error) {
    return (
      <div>
        <h3 style={{ color: "red" }}>{error}</h3>

        <button onClick={loadWallet}>
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>کیف پول</h2>

      <div
        style={{
          padding: "20px",
          marginBottom: "20px",
          background: "#fff",
          borderRadius: "8px",
        }}
      >
        <h3>موجودی</h3>

        <strong>
          {Number(balance).toLocaleString("fa-IR")} تومان
        </strong>
      </div>

      <h3>تاریخچه تراکنش‌ها</h3>

      {transactions.length === 0 ? (
        <p>هنوز تراکنشی ثبت نشده است.</p>
      ) : (
        <table
          style={{
            width: "100%",
            background: "#fff",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>مبلغ</th>
              <th>نوع</th>
              <th>توضیح</th>
              <th>تاریخ</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>

                <td>
                  {Number(transaction.amount).toLocaleString("fa-IR")}
                  {" تومان"}
                </td>

                <td>{transaction.type}</td>

                <td>{transaction.description || "-"}</td>

                <td>
                  {new Date(transaction.createdAt).toLocaleString(
                    "fa-IR"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}