import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/companies";

const emptyForm = {
  companyName: "",
  partner: "KOGO",
  stage: "Pipeline",
  signupAmount: "",
  accountOwner: "",
  teamMember: "",
  clientPOC: "",
  email: "",
  phone: "",
  notes: "",
};

function App() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Unable to load companies");
      }

      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      console.error(err);
      setError(
        "Backend connect avvatledu. Please make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setEditingId(company.id);

    setForm({
      companyName: company.companyName || "",
      partner: company.partner || "KOGO",
      stage: company.stage || "Pipeline",
      signupAmount: company.signupAmount || "",
      accountOwner: company.accountOwner || "",
      teamMember: company.teamMember || "",
      clientPOC: company.clientPOC || "",
      email: company.email || "",
      phone: company.phone || "",
      notes: company.notes || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveCompany = async (e) => {
    e.preventDefault();

    if (!form.companyName.trim()) {
      alert("Company name is required");
      return;
    }

    try {
      const url = editingId ? `${API}/${editingId}` : API;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          signupAmount: Number(form.signupAmount) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save company");
      }

      await loadCompanies();
      closeForm();

      alert(editingId ? "Company updated successfully!" : "Company added successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deleteCompany = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this company?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete company");
      }

      await loadCompanies();
      alert("Company deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const text = `
        ${company.companyName}
        ${company.partner}
        ${company.stage}
        ${company.accountOwner}
        ${company.clientPOC}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStage =
        filterStage === "All" || company.stage === filterStage;

      return matchesSearch && matchesStage;
    });
  }, [companies, search, filterStage]);

  const totalCompanies = companies.length;

  const pipelineCount = companies.filter(
    (company) => company.stage === "Pipeline"
  ).length;

  const discussionCount = companies.filter(
    (company) => company.stage === "Discussion"
  ).length;

  const proposalCount = companies.filter(
    (company) => company.stage === "Proposal"
  ).length;

  const demoCount = companies.filter(
    (company) => company.stage === "Demo"
  ).length;

  const signedCount = companies.filter(
    (company) => company.stage === "Signed"
  ).length;

  const lostCount = companies.filter(
    (company) => company.stage === "Lost"
  ).length;

  const totalValue = companies.reduce(
    (sum, company) => sum + Number(company.signupAmount || 0),
    0
  );

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const exportCSV = () => {
    if (!companies.length) {
      alert("No companies available to export.");
      return;
    }

    const headers = [
      "Company Name",
      "Partner",
      "Stage",
      "Signup Amount",
      "Account Owner",
      "Team Member",
      "Client POC",
      "Email",
      "Phone",
      "Notes",
    ];

    const rows = companies.map((company) => [
      company.companyName,
      company.partner,
      company.stage,
      company.signupAmount,
      company.accountOwner,
      company.teamMember,
      company.clientPOC,
      company.email,
      company.phone,
      company.notes,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "etidhi-companies.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">E</div>

          <div>
            <h1>EtiDhi</h1>
            <p>Company Tracker</p>
          </div>
        </div>

        <button className="add-button" onClick={openAddForm}>
          + Add Company
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">PIPELINE MANAGEMENT</p>

            <h2>Track your company opportunities</h2>

            <p>
              Manage potential companies, partners, signup opportunities,
              owners and onboarding information in one place.
            </p>
          </div>

          <div className="hero-actions">
            <button className="secondary-button" onClick={exportCSV}>
              ↓ Export CSV
            </button>

            <button className="primary-button" onClick={openAddForm}>
              + New Company
            </button>
          </div>
        </section>

        {error && (
          <div className="error-box">
            ⚠️ {error}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">🏢</div>
            <div>
              <span>Total Companies</span>
              <strong>{totalCompanies}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">📋</div>
            <div>
              <span>Pipeline</span>
              <strong>{pipelineCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">💬</div>
            <div>
              <span>Discussion</span>
              <strong>{discussionCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cyan">📄</div>
            <div>
              <span>Proposal</span>
              <strong>{proposalCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pink">🎯</div>
            <div>
              <span>Demo</span>
              <strong>{demoCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>Signed</span>
              <strong>{signedCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">✕</div>
            <div>
              <span>Lost</span>
              <strong>{lostCount}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon gold">₹</div>
            <div>
              <span>Total Signup Value</span>
              <strong>{formatAmount(totalValue)}</strong>
            </div>
          </div>
        </section>

        <section className="companies-section">
          <div className="section-header">
            <div>
              <h2>Companies</h2>
              <p>{filteredCompanies.length} companies</p>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Search company, partner, owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <option value="All">All Stages</option>
                <option value="Pipeline">Pipeline</option>
                <option value="Discussion">Discussion</option>
                <option value="Proposal">Proposal</option>
                <option value="Demo">Demo</option>
                <option value="Signed">Signed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loader"></div>
              <p>Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No companies found</h3>
              <p>Add a company to start tracking your pipeline.</p>

              <button className="primary-button" onClick={openAddForm}>
                + Add Company
              </button>
            </div>
          ) : (
            <div className="company-grid">
              {filteredCompanies.map((company) => (
                <article className="company-card" key={company.id}>
                  <div className="company-card-top">
                    <div className="company-avatar">
                      {company.companyName
                        ?.charAt(0)
                        ?.toUpperCase() || "C"}
                    </div>

                    <div className="company-title">
                      <h3>{company.companyName}</h3>

                      <div className="company-tags">
                        <span className={`stage ${company.stage?.toLowerCase()}`}>
                          {company.stage}
                        </span>

                        <span className="partner">
                          {company.partner}
                        </span>
                      </div>
                    </div>

                    <div className="card-menu">
                      <button onClick={() => openEditForm(company)}>
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => deleteCompany(company.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="amount-box">
                    <span>Signup Amount</span>
                    <strong>
                      {formatAmount(company.signupAmount)}
                    </strong>
                  </div>

                  <div className="details">
                    <div className="detail">
                      <span>👤 Account Owner</span>
                      <strong>{company.accountOwner || "-"}</strong>
                    </div>

                    <div className="detail">
                      <span>👥 Team Member</span>
                      <strong>{company.teamMember || "-"}</strong>
                    </div>

                    <div className="detail">
                      <span>🤝 Client POC</span>
                      <strong>{company.clientPOC || "-"}</strong>
                    </div>

                    <div className="detail">
                      <span>✉ Email</span>
                      <strong>{company.email || "-"}</strong>
                    </div>

                    <div className="detail">
                      <span>📞 Phone</span>
                      <strong>{company.phone || "-"}</strong>
                    </div>
                  </div>

                  <div className="notes">
                    <span>Notes</span>
                    <p>{company.notes || "No notes added."}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showForm && (
        <div className="modal-overlay" onMouseDown={closeForm}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Edit Company" : "Add Company"}</h2>
                <p>
                  {editingId
                    ? "Update company information"
                    : "Enter company pipeline details"}
                </p>
              </div>

              <button className="close-button" onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={saveCompany}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Company Name *</label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="e.g. ABC Technologies"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Partner</label>

                  <select
                    name="partner"
                    value={form.partner}
                    onChange={handleChange}
                  >
                    <option value="KOGO">KOGO</option>
                    <option value="Contineu">Contineu</option>
                    <option value="Freshworks">Freshworks</option>
                    <option value="Zoho">Zoho</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stage</label>

                  <select
                    name="stage"
                    value={form.stage}
                    onChange={handleChange}
                  >
                    <option value="Pipeline">Pipeline</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Demo">Demo</option>
                    <option value="Signed">Signed</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Signup Amount (₹)</label>

                  <input
                    type="number"
                    name="signupAmount"
                    value={form.signupAmount}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Account Owner</label>

                  <input
                    name="accountOwner"
                    value={form.accountOwner}
                    onChange={handleChange}
                    placeholder="Sukumar"
                  />
                </div>

                <div className="form-group">
                  <label>Team Member</label>

                  <input
                    name="teamMember"
                    value={form.teamMember}
                    onChange={handleChange}
                    placeholder="Rahul"
                  />
                </div>

                <div className="form-group">
                  <label>Client POC</label>

                  <input
                    name="clientPOC"
                    value={form.clientPOC}
                    onChange={handleChange}
                    placeholder="Arun Kumar"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="arun@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                  />
                </div>

                <div className="form-group full">
                  <label>Onboarding / Notes</label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add important notes..."
                    rows="4"
                  ></textarea>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingId ? "Update Company" : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;