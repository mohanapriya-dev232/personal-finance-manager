const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function getToken() {
  return localStorage.getItem("finance_token");
}

export function setSession(session) {
  localStorage.setItem("finance_token", session.token);
  localStorage.setItem("finance_user", JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("finance_user");
  return raw ? JSON.parse(raw) : null;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function downloadPdf(month) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/reports/pdf?month=${encodeURIComponent(month)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Could not download PDF report.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expense-report-${month}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
