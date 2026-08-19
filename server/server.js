const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 5000;

const DATA_FILE = path.join(__dirname, "companies.json");

app.use(cors());
app.use(express.json());

function readCompanies() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }

    const data = fs.readFileSync(DATA_FILE, "utf8");

    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading companies:", error);
    return [];
  }
}

function saveCompanies(companies) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(companies, null, 2),
    "utf8"
  );
}

app.get("/", (req, res) => {
  res.json({
    message: "EtiDhi Company Tracker Backend is running",
  });
});

app.get("/api/companies", (req, res) => {
  try {
    const companies = readCompanies();

    companies.sort((a, b) => b.id - a.id);

    res.json(companies);
  } catch (error) {
    res.status(500).json({
      error: "Unable to fetch companies",
    });
  }
});

app.post("/api/companies", (req, res) => {
  try {
    const companies = readCompanies();

    const {
      companyName,
      partner,
      stage,
      signupAmount,
      accountOwner,
      teamMember,
      clientPOC,
      email,
      phone,
      notes,
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    const newCompany = {
      id: Date.now(),
      companyName: companyName.trim(),
      partner: partner || "KOGO",
      stage: stage || "Pipeline",
      signupAmount: Number(signupAmount) || 0,
      accountOwner: accountOwner || "",
      teamMember: teamMember || "",
      clientPOC: clientPOC || "",
      email: email || "",
      phone: phone || "",
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    companies.push(newCompany);

    saveCompanies(companies);

    res.status(201).json(newCompany);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create company",
    });
  }
});

app.put("/api/companies/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const companies = readCompanies();

    const index = companies.findIndex(
      (company) => Number(company.id) === id
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    const oldCompany = companies[index];

    const {
      companyName,
      partner,
      stage,
      signupAmount,
      accountOwner,
      teamMember,
      clientPOC,
      email,
      phone,
      notes,
    } = req.body;

    companies[index] = {
      ...oldCompany,
      companyName:
        companyName !== undefined
          ? String(companyName).trim()
          : oldCompany.companyName,

      partner:
        partner !== undefined
          ? partner
          : oldCompany.partner,

      stage:
        stage !== undefined
          ? stage
          : oldCompany.stage,

      signupAmount:
        signupAmount !== undefined
          ? Number(signupAmount) || 0
          : oldCompany.signupAmount,

      accountOwner:
        accountOwner !== undefined
          ? accountOwner
          : oldCompany.accountOwner,

      teamMember:
        teamMember !== undefined
          ? teamMember
          : oldCompany.teamMember,

      clientPOC:
        clientPOC !== undefined
          ? clientPOC
          : oldCompany.clientPOC,

      email:
        email !== undefined
          ? email
          : oldCompany.email,

      phone:
        phone !== undefined
          ? phone
          : oldCompany.phone,

      notes:
        notes !== undefined
          ? notes
          : oldCompany.notes,

      updatedAt: new Date().toISOString(),
    };

    saveCompanies(companies);

    res.json(companies[index]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to update company",
    });
  }
});

app.delete("/api/companies/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const companies = readCompanies();

    const filteredCompanies = companies.filter(
      (company) => Number(company.id) !== id
    );

    if (filteredCompanies.length === companies.length) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    saveCompanies(filteredCompanies);

    res.json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to delete company",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});