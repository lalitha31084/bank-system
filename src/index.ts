import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import {
  createAccount,
  deposit,
  withdraw,
  closeAccount
} from "./write/commandHandlers";

import {
  getAccount,
  getTransactions,
  getEvents,
  getBalanceAt,
  rebuildProjections,
  getProjectionsStatus
} from "./read/queryHandlers";

dotenv.config();

const app = express();

/* Enable CORS */
app.use(cors());

app.use(express.json());

/* Health Check */
app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

/* Simple GET route for testing */
app.get("/api/accounts", (req: Request, res: Response) => {
  res.json({
    message: "Bank Account API running"
  });
});

/* Create Account */
app.post("/api/accounts", async (req: Request, res: Response) => {
  try {
    await createAccount(req.body);
    res.status(202).json({ message: "Account created" });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

/* Deposit */
app.post("/api/accounts/:id/deposit", async (req: Request, res: Response) => {
  try {
    await deposit(req.params.id, req.body);
    res.status(202).json({ message: "Deposit successful" });
  } catch (err: any) {
    if (err.message === "Account not found") {
      res.status(404).json({ error: err.message });
    } else if (err.message === "Account is closed") {
      res.status(409).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

/* Withdraw */
app.post("/api/accounts/:id/withdraw", async (req: Request, res: Response) => {
  try {
    await withdraw(req.params.id, req.body);
    res.status(202).json({ message: "Withdrawal successful" });
  } catch (err: any) {
    if (err.message === "Account not found") {
      res.status(404).json({ error: err.message });
    } else if (err.message === "Invalid amount") {
      res.status(400).json({ error: err.message });
    } else {
      res.status(409).json({ error: err.message });
    }
  }
});

/* Close Account */
app.post("/api/accounts/:id/close", async (req: Request, res: Response) => {
  try {
    await closeAccount(req.params.id);
    res.status(202).json({ message: "Account closed" });
  } catch (err: any) {
    if (err.message === "Account not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(409).json({ error: err.message });
    }
  }
});

/* Get Account */
app.get("/api/accounts/:id", async (req: Request, res: Response) => {
  try {
    const account = await getAccount(req.params.id);

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* Get Transactions */
app.get("/api/accounts/:id/transactions", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const data = await getTransactions(
      req.params.id,
      page,
      pageSize
    );

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* Get Events */
app.get("/api/accounts/:id/events", async (req: Request, res: Response) => {
  try {
    const events = await getEvents(req.params.id);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* Time Travel Query */
app.get("/api/accounts/:id/balance-at/:timestamp", async (req: Request, res: Response) => {
  try {
    const data = await getBalanceAt(req.params.id, req.params.timestamp);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* Rebuild Projections */
app.post("/api/projections/rebuild", async (req: Request, res: Response) => {
  try {
    await rebuildProjections();
    res.status(202).json({ message: "Projection rebuild initiated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* Get Projections Status */
app.get("/api/projections/status", async (req: Request, res: Response) => {
  try {
    const status = await getProjectionsStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.API_PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});