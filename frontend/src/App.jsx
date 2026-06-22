import { useEffect, useMemo, useState } from "react";
import { Download, LogOut, Pencil, Plus, Search, Trash2, WalletCards } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest, clearSession, downloadPdf, getStoredUser, getToken, setSession } from "./api";

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  transaction_date: new Date().toISOString().slice(0, 10),
  note: "",
};

const categories = ["Food", "Shopping", "Bills", "Travel", "Health", "Education", "Salary", "Savings", "Other"];
const colors = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#0891b2", "#be123c"];

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    month: new Date().toISOString().slice(0, 7),
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (getToken()) loadData();
  }, []);

  async function loadData(nextFilters = filters) {
    const params = new URLSearchParams();
    if (nextFilters.search) params.set("search", nextFilters.search);
    if (nextFilters.type) params.set("type", nextFilters.type);
    if (nextFilters.category) params.set("category", nextFilters.category);

    const [transactionData, reportData] = await Promise.all([
      apiRequest(`/transactions?${params.toString()}`),
      apiRequest(`/reports/monthly?month=${nextFilters.month}`),
    ]);
    setTransactions(transactionData.transactions);
    setReport(reportData);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError("");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const session = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(auth),
      });
      setSession(session);
      setUser(session.user);
      await loadData();
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function submitTransaction(event) {
    event.preventDefault();
    setMessage("");
    const method = editingId ? "PUT" : "POST";
    const path = editingId ? `/transactions/${editingId}` : "/transactions";
    try {
      await apiRequest(path, { method, body: JSON.stringify(form) });
      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? "Transaction updated." : "Transaction added.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTransaction(id) {
    await apiRequest(`/transactions/${id}`, { method: "DELETE" });
    await loadData();
  }

  function editTransaction(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      transaction_date: item.transaction_date,
      note: item.note,
    });
  }

  async function applyFilters(next) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    await loadData(merged);
  }

  function logout() {
    clearSession();
    setUser(null);
    setTransactions([]);
    setReport(null);
  }

  const totals = report?.summary || { income: 0, expense: 0, saving: 0, balance: 0, expense_by_category: [] };
  const typeChart = useMemo(
    () => [
      { name: "Income", amount: totals.income },
      { name: "Expenses", amount: totals.expense },
      { name: "Savings", amount: totals.saving },
    ],
    [totals]
  );

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="brand-row">
            <WalletCards size={34} />
            <div>
              <h1>Personal Finance Manager</h1>
              <p>Track money in, money out, and savings progress.</p>
            </div>
          </div>
          <form onSubmit={submitAuth} className="auth-form">
            {authMode === "register" && (
              <label>
                Name
                <input value={auth.name} onChange={(e) => setAuth({ ...auth, name: e.target.value })} />
              </label>
            )}
            <label>
              Email
              <input type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={auth.password}
                onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              />
            </label>
            {authError && <p className="error">{authError}</p>}
            <button type="submit">{authMode === "login" ? "Login" : "Create account"}</button>
          </form>
          <button className="link-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? "Need an account? Register" : "Already registered? Login"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Welcome, {user.name}</span>
          <h1>Finance Dashboard</h1>
        </div>
        <button className="icon-button" onClick={logout} title="Logout">
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <section className="stats-grid">
        <Stat label="Income" value={currency(totals.income)} />
        <Stat label="Expenses" value={currency(totals.expense)} />
        <Stat label="Savings" value={currency(totals.saving)} />
        <Stat label="Balance" value={currency(totals.balance)} />
      </section>

      <section className="content-grid">
        <form className="panel transaction-form" onSubmit={submitTransaction}>
          <h2>{editingId ? "Edit Transaction" : "Add Transaction"}</h2>
          <div className="form-grid">
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label>
              Amount
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="saving">Saving</option>
              </select>
            </label>
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              />
            </label>
            <label>
              Note
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
          {message && <p className="message">{message}</p>}
          <button type="submit" className="primary-action">
            <Plus size={18} />
            {editingId ? "Save Changes" : "Add Transaction"}
          </button>
        </form>

        <section className="panel chart-panel">
          <h2>Monthly Overview</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={typeChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => currency(value)} />
              <Bar dataKey="amount" fill="#2563eb" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel chart-panel">
          <h2>Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={totals.expense_by_category} dataKey="amount" nameKey="category" outerRadius={85} label>
                {totals.expense_by_category.map((entry, index) => (
                  <Cell key={entry.category} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </section>

      <section className="panel">
        <div className="table-header">
          <h2>Transactions</h2>
          <button className="download-button" type="button" onClick={() => downloadPdf(filters.month)}>
            <Download size={18} />
            PDF
          </button>
        </div>
        <div className="filters">
          <label>
            <Search size={16} />
            <input
              placeholder="Search title or note"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
            />
          </label>
          <input type="month" value={filters.month} onChange={(e) => applyFilters({ month: e.target.value })} />
          <select value={filters.type} onChange={(e) => applyFilters({ type: e.target.value })}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="saving">Saving</option>
          </select>
          <select value={filters.category} onChange={(e) => applyFilters({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.transaction_date}</td>
                  <td>
                    <strong>{item.title}</strong>
                    {item.note && <span>{item.note}</span>}
                  </td>
                  <td>
                    <span className={`pill ${item.type}`}>{item.type}</span>
                  </td>
                  <td>{item.category}</td>
                  <td>{currency(item.amount)}</td>
                  <td>
                    <button className="table-action" onClick={() => editTransaction(item)} title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className="table-action danger" onClick={() => deleteTransaction(item.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
