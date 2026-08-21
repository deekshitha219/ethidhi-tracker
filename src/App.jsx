import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  companyName: "",
  partner: "KOGO",
  dealValue: "",
  accountOwner: "",
  teamMembers: "",
  clientPOC: "",
  email: "",
  phone: "",
  stage: "Pipeline",
  notes: "",
};

const STAGES = ["Pipeline", "Discussion", "Proposal", "Demo", "Signed", "Lost"];
const PARTNERS = ["KOGO", "Contineu", "Freshworks", "Zoho", "Other"];

const icons = {
  companies: "▣",
  pipeline: "◫",
  discussion: "◌",
  proposal: "▤",
  demo: "◎",
  signed: "✓",
  lost: "×",
  value: "₹",
  search: "⌕",
  plus: "+",
  edit: "✎",
  delete: "⌫",
  person: "●",
  team: "◆",
  contact: "◉",
  phone: "◍",
  mail: "✉",
  notes: "▱",
};

function initials(name = "Company") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("") || "C";
}

function money(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function normaliseCompany(c) {
  return {
    ...c,
    id: c.id,
    companyName: c.companyName || c.name || "",
    partner: c.partner || "Other",
    dealValue: Number(c.dealValue ?? c.signupAmount ?? c.amount ?? 0),
    accountOwner: c.accountOwner || c.owner || "",
    teamMembers: c.teamMembers || c.teamMember || "",
    clientPOC: c.clientPOC || c.contactPerson || "",
    email: c.email || "",
    phone: c.phone || "",
    stage: c.stage || "Pipeline",
    notes: c.notes || "",
  };
}

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/companies`);
      if (!res.ok) throw new Error("Could not load companies");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data.map(normaliseCompany) : []);
    } catch (e) {
      setError(`Backend connection failed. Make sure the server is running on ${API}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const stats = useMemo(() => {
    const count = (stage) => companies.filter((c) => c.stage === stage).length;
    return {
      total: companies.length,
      pipeline: count("Pipeline"),
      discussion: count("Discussion"),
      proposal: count("Proposal"),
      demo: count("Demo"),
      signed: count("Signed"),
      lost: count("Lost"),
      value: companies.reduce((sum, c) => sum + Number(c.dealValue || 0), 0),
    };
  }, [companies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesStage = stageFilter === "All" || c.stage === stageFilter;
      const matchesQuery =
        !q ||
        [c.companyName, c.partner, c.accountOwner, c.teamMembers, c.clientPOC, c.email]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesStage && matchesQuery;
    });
  }, [companies, query, stageFilter]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal("add");
  }

  function openEdit(company) {
    setForm({
      companyName: company.companyName,
      partner: company.partner,
      dealValue: company.dealValue,
      accountOwner: company.accountOwner,
      teamMembers: company.teamMembers,
      clientPOC: company.clientPOC,
      email: company.email,
      phone: company.phone,
      stage: company.stage,
      notes: company.notes,
    });
    setModal(company);
  }

  function closeModal() {
    if (!saving) setModal(null);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveCompany(e) {
    e.preventDefault();
    if (!form.companyName.trim()) return;

    try {
      setSaving(true);
      setError("");

      const editing = modal !== "add";
      const url = editing ? `${API}/api/companies/${modal.id}` : `${API}/api/companies`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dealValue: Number(form.dealValue || 0),
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      await loadCompanies();
      setModal(null);
    } catch (e) {
      setError("Unable to save the company. Check that the backend is running.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCompany(company) {
    const ok = window.confirm(`Delete ${company.companyName}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/api/companies/${company.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch {
      setError("Could not delete the company.");
    }
  }

  function exportCSV() {
    const headers = [
      "Company",
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

    const rows = companies.map((c) => [
      c.companyName,
      c.partner,
      c.stage,
      c.dealValue,
      c.accountOwner,
      c.teamMembers,
      c.clientPOC,
      c.email,
      c.phone,
      c.notes,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "etidhi-company-pipeline.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">E</div>
          <div>
            <h1>EtiDhi</h1>
            <span>Company Pipeline Tracker</span>
          </div>
        </div>

        <button className="primary-btn" onClick={openAdd}>
          <span>{icons.plus}</span> Add Company
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="hero-label">ETIDHI BUSINESS</div>
            <h2>Pipeline Management</h2>
            <p>
              Track companies, manage opportunities and monitor your signup pipeline
              from one professional workspace.
            </p>
          </div>

          <div className="hero-actions">
            <button className="secondary-btn" onClick={exportCSV}>
              ↓ Export CSV
            </button>
            <button className="white-btn" onClick={openAdd}>
              + New Company
            </button>
          </div>
        </section>

        <section className="stats-grid">
          <Stat tone="blue" icon={icons.companies} label="Total Companies" value={stats.total} />
          <Stat tone="purple" icon={icons.pipeline} label="Pipeline" value={stats.pipeline} />
          <Stat tone="orange" icon={icons.discussion} label="Discussion" value={stats.discussion} />
          <Stat tone="yellow" icon={icons.proposal} label="Proposal" value={stats.proposal} />
          <Stat tone="pink" icon={icons.demo} label="Demo" value={stats.demo} />
          <Stat tone="green" icon={icons.signed} label="Signed" value={stats.signed} />
          <Stat tone="red" icon={icons.lost} label="Lost" value={stats.lost} />
          <Stat tone="teal" icon={icons.value} label="Total Signup Value" value={money(stats.value)} />
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="toolbar">
          <div className="search-box">
            <span>{icons.search}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies, POC, owner..."
            />
          </div>

          <select
            className="stage-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="All">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </section>

        <section className="section-heading">
          <div>
            <h3>Companies</h3>
            <p>{filtered.length} companies in your current view</p>
          </div>
          <button className="small-add" onClick={openAdd}>+ Add Company</button>
        </section>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <h3>Loading pipeline...</h3>
            <p>Connecting to the EtiDhi backend.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{icons.companies}</div>
            <h3>No companies found</h3>
            <p>{companies.length ? "Try changing your search or stage filter." : "Add your first company to start tracking the pipeline."}</p>
            <button className="primary-btn" onClick={openAdd}>+ Add Company</button>
          </div>
        ) : (
          <div className="company-grid">
            {filtered.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={() => openEdit(company)}
                onDelete={() => removeCompany(company)}
              />
            ))}
          </div>
        )}
      </main>

      {modal && (
        <div className="modal-overlay" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{modal === "add" ? "Add New Company" : "Edit Company"}</h2>
                <p>Keep the signup pipeline information up to date.</p>
              </div>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={saveCompany}>
              <div className="form-grid">
                <Field label="Company Name" required>
                  <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="e.g. ABC Technologies" required />
                </Field>

                <Field label="Partner">
                  <select value={form.partner} onChange={(e) => update("partner", e.target.value)}>
                    {PARTNERS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>

                <Field label="Signup Amount">
                  <input type="number" min="0" value={form.dealValue} onChange={(e) => update("dealValue", e.target.value)} placeholder="500000" />
                </Field>

                <Field label="Stage">
                  <select value={form.stage} onChange={(e) => update("stage", e.target.value)}>
                    {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </Field>

                <Field label="Account Owner">
                  <input value={form.accountOwner} onChange={(e) => update("accountOwner", e.target.value)} placeholder="e.g. Raj" />
                </Field>

                <Field label="Team Member">
                  <input value={form.teamMembers} onChange={(e) => update("teamMembers", e.target.value)} placeholder="e.g. Rahul Sharma" />
                </Field>

                <Field label="Client POC">
                  <input value={form.clientPOC} onChange={(e) => update("clientPOC", e.target.value)} placeholder="e.g. Arun Kumar" />
                </Field>

                <Field label="Phone">
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="9876543210" />
                </Field>

                <Field label="Email">
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="client@company.com" />
                </Field>

                <Field label="Notes" full>
                  <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Add onboarding notes, next steps, requirements..." />
                </Field>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : modal === "add" ? "Save Company" : "Update Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ tone, icon, label, value }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Field({ label, required, full, children }) {
  return (
    <div className={`form-group ${full ? "full" : ""}`}>
      <label>{label}{required && <span className="required">*</span>}</label>
      {children}
    </div>
  );
}

function CompanyCard({ company, onEdit, onDelete }) {
  const stageClass = company.stage.toLowerCase();

  return (
    <article className="company-card">
      <div className="company-top">
        <div className="company-avatar">{initials(company.companyName)}</div>

        <div className="company-title">
          <h3 title={company.companyName}>{company.companyName}</h3>
          <div className="company-meta">
            <span className={`stage-badge ${stageClass}`}>{company.stage}</span>
            <span className="partner-badge">{company.partner}</span>
          </div>
        </div>

        <div className="card-actions">
          <button onClick={onEdit} title="Edit">{icons.edit}</button>
          <button className="delete-btn" onClick={onDelete} title="Delete">{icons.delete}</button>
        </div>
      </div>

      <div className="amount-box">
        <span>Signup Amount</span>
        <strong>{money(company.dealValue)}</strong>
      </div>

      <div className="details-grid">
        <Detail icon={icons.person} label="Account Owner" value={company.accountOwner} />
        <Detail icon={icons.team} label="Team Member" value={company.teamMembers} />
        <Detail icon={icons.contact} label="Client POC" value={company.clientPOC} />
        <Detail icon={icons.phone} label="Phone" value={company.phone} />
        <Detail icon={icons.mail} label="Email" value={company.email} />
      </div>

      <div className="notes">
        <span>{icons.notes}</span>
        <div>
          <strong>Notes</strong>
          <p>{company.notes || "No notes added."}</p>
        </div>
      </div>
    </article>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="detail">
      <div className="detail-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong title={value || "Not added"}>{value || "Not added"}</strong>
      </div>
    </div>
  );
}
