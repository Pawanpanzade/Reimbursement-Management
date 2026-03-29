import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "reimbursement-secret-key";

app.use(cors());
app.use(express.json());

// --- Mock Database (In-memory for demo) ---
const db = {
  users: [] as any[],
  companies: [] as any[],
  expenses: [] as any[],
  approvalRules: [] as any[],
};

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth: Signup (First time creates company)
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name, companyName, currency, country } = req.body;

  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create Company if it's the first user or explicitly requested
  let companyId = "";
  const isFirstUser = db.users.length === 0;
  
  if (isFirstUser || companyName) {
    const newCompany = {
      id: Math.random().toString(36).substr(2, 9),
      name: companyName || "Default Company",
      currency: currency || "USD",
      country: country || "US",
    };
    db.companies.push(newCompany);
    companyId = newCompany.id;
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password: hashedPassword,
    name,
    role: isFirstUser ? "Admin" : "Employee",
    companyId,
    managerId: null,
  };

  db.users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, companyId: newUser.companyId }, JWT_SECRET);
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, companyId: newUser.companyId } });
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, companyId: user.companyId }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId } });
});

// Users: Get all (Admin only)
app.get("/api/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== "Admin") return res.sendStatus(403);
  const users = db.users.filter(u => u.companyId === req.user.companyId);
  res.json(users.map(({ password, ...u }) => u));
});

// Users: Create (Admin only)
app.post("/api/users", authenticateToken, async (req: any, res) => {
  if (req.user.role !== "Admin") return res.sendStatus(403);
  const { email, password, name, role, managerId } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    password: hashedPassword,
    name,
    role,
    companyId: req.user.companyId,
    managerId,
  };
  db.users.push(newUser);
  res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
});

// Expenses: Submit
app.post("/api/expenses", authenticateToken, (req: any, res) => {
  const { amount, currency, category, description, date, receiptData } = req.body;
  const newExpense = {
    id: Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    companyId: req.user.companyId,
    amount,
    currency,
    category,
    description,
    date,
    status: "Pending",
    currentApproverStep: 0,
    approvals: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  db.expenses.push(newExpense);
  res.json(newExpense);
});

// Expenses: Get My History
app.get("/api/expenses/my", authenticateToken, (req: any, res) => {
  const expenses = db.expenses.filter(e => e.userId === req.user.id);
  res.json(expenses);
});

// Expenses: Get Pending for Approver
app.get("/api/expenses/pending", authenticateToken, (req: any, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user || (user.role !== "Manager" && user.role !== "CFO" && user.role !== "Admin")) return res.sendStatus(403);

  // Multi-step approval: Manager -> CFO
  const pending = db.expenses.filter(e => {
    if (e.status !== "Pending") return false;
    
    const submitter = db.users.find(u => u.id === e.userId);
    if (!submitter) return false;

    // Step 0: Manager approval
    if (e.currentApproverStep === 0) {
      // Manager check
      if (submitter.managerId === user.id || user.role === "Admin") return true;
    }
    
    // Step 1: CFO approval
    if (e.currentApproverStep === 1) {
      if (user.role === "CFO" || user.role === "Admin") return true;
    }

    return false;
  });
  
  res.json(pending);
});

// Expenses: Approve/Reject
app.post("/api/expenses/:id/action", authenticateToken, (req: any, res) => {
  const { action, comment } = req.body; // action: "Approve" or "Reject"
  const expense = db.expenses.find(e => e.id === req.params.id);
  
  if (!expense) return res.status(404).json({ error: "Expense not found" });

  expense.approvals.push({
    approverId: req.user.id,
    action,
    comment,
    date: new Date().toISOString(),
  });

  if (action === "Reject") {
    expense.status = "Rejected";
  } else {
    // Multi-step approval: Manager -> CFO
    if (expense.currentApproverStep === 0) {
      // Move to CFO approval
      expense.currentApproverStep = 1;
    } else if (expense.currentApproverStep === 1) {
      // Final approval
      expense.status = "Approved";
    }
  }

  res.json(expense);
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
