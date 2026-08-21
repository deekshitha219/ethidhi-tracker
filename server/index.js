const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

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
  const companies = readCompanies();

  companies.sort((a, b) => Number(b.id) - Number(a.id));

  res.json(companies);
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

    if (!companyName || !String(companyName).trim()) {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    const newCompany = {
      id: Date.now(),
      companyName: String(companyName).trim(),
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

    companies[index] = {
      ...oldCompany,
      ...req.body,
      id: oldCompany.id,
      updatedAt: new Date().toISOString(),
    };

    if (companies[index].signupAmount !== undefined) {
      companies[index].signupAmount =
        Number(companies[index].signupAmount) || 0;
    }

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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});