const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./etidhi.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyName TEXT NOT NULL,
      partner TEXT,
      dealValue INTEGER DEFAULT 0,
      accountOwner TEXT,
      teamMembers TEXT,
      clientPOC TEXT,
      email TEXT,
      phone TEXT,
      stage TEXT DEFAULT 'Pipeline',
      notes TEXT
    )
  `);

  db.get("SELECT COUNT(*) AS count FROM companies", (err, row) => {
    if (err || row.count > 0) return;

    const seed = [
      ["Cognizant", "KOGO", 5000000, "Raj", "Rahul Sharma", "Arun", "", "8474748884", "Pipeline", "Initial discussion completed."],
      ["TCS", "KOGO", 70000, "Srinivas", "Rahul", "Arun Kumar", "", "9866666388", "Discussion", "Client POC follow-up pending."],
      ["XYZ Solutions", "Contineu", 250000, "Priya", "Anil", "Kiran", "", "9876543210", "Discussion", "Proposal preparation in progress."],
      ["ABC Technologies", "KOGO", 500000, "Rahul", "Deekshitha", "Arun Kumar", "", "9000000000", "Pipeline", "Demo to be scheduled."]
    ];

    const stmt = db.prepare(`
      INSERT INTO companies
      (companyName, partner, dealValue, accountOwner, teamMembers, clientPOC, email, phone, stage, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seed.forEach((item) => stmt.run(item));
    stmt.finalize();
  });
});

app.get("/", (req, res) => {
  res.json({ service: "EtiDhi Pipeline API", status: "running" });
});

app.get("/api/companies", (req, res) => {
  db.all("SELECT * FROM companies ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/companies", (req, res) => {
  const {
    companyName, partner, dealValue, accountOwner, teamMembers,
    clientPOC, email, phone, stage, notes
  } = req.body;

  if (!companyName || !String(companyName).trim()) {
    return res.status(400).json({ error: "Company name is required" });
  }

  const sql = `
    INSERT INTO companies
    (companyName, partner, dealValue, accountOwner, teamMembers, clientPOC, email, phone, stage, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      companyName.trim(),
      partner || "Other",
      Number(dealValue || 0),
      accountOwner || "",
      teamMembers || "",
      clientPOC || "",
      email || "",
      phone || "",
      stage || "Pipeline",
      notes || ""
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM companies WHERE id = ?", [this.lastID], (getErr, row) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        res.status(201).json(row);
      });
    }
  );
});

app.put("/api/companies/:id", (req, res) => {
  const {
    companyName, partner, dealValue, accountOwner, teamMembers,
    clientPOC, email, phone, stage, notes
  } = req.body;

  const sql = `
    UPDATE companies SET
      companyName=?, partner=?, dealValue=?, accountOwner=?, teamMembers=?,
      clientPOC=?, email=?, phone=?, stage=?, notes=?
    WHERE id=?
  `;

  db.run(
    sql,
    [
      companyName,
      partner,
      Number(dealValue || 0),
      accountOwner || "",
      teamMembers || "",
      clientPOC || "",
      email || "",
      phone || "",
      stage || "Pipeline",
      notes || "",
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: "Company not found" });
      db.get("SELECT * FROM companies WHERE id = ?", [req.params.id], (getErr, row) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        res.json(row);
      });
    }
  );
});

app.delete("/api/companies/:id", (req, res) => {
  db.run("DELETE FROM companies WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company deleted" });
  });
});

app.listen(PORT, () => {
  console.log(`EtiDhi backend running on http://localhost:${PORT}`);
});
