import { appendEvent } from "./eventStore";
import { pool } from "../common/db";

export async function createAccount(cmd: any): Promise<void> {

  const { accountId, ownerName, initialBalance, currency } = cmd;

  const existing = await pool.query(
    "SELECT 1 FROM events WHERE aggregate_id=$1 LIMIT 1",
    [accountId]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    throw new Error("Account already exists");
  }

  await appendEvent(accountId, "AccountCreated", {
    accountId,
    ownerName,
    initialBalance,
    currency
  });
}

export async function deposit(accountId: string, cmd: any): Promise<void> {

  if (cmd.amount <= 0) {
    throw new Error("Invalid amount");
  }

  await appendEvent(accountId, "MoneyDeposited", cmd);
}

export async function withdraw(accountId: string, cmd: any): Promise<void> {

  const res = await pool.query(
    "SELECT balance,status FROM account_summaries WHERE account_id=$1",
    [accountId]
  );

  if (res.rowCount === 0) {
    throw new Error("Account not found");
  }

  if (Number(res.rows[0].balance) < cmd.amount) {
    throw new Error("Insufficient funds");
  }

  await appendEvent(accountId, "MoneyWithdrawn", cmd);
}

export async function closeAccount(accountId: string): Promise<void> {

  const res = await pool.query(
    "SELECT balance FROM account_summaries WHERE account_id=$1",
    [accountId]
  );

  if (res.rowCount === 0) {
    throw new Error("Account not found");
  }

  if (Number(res.rows[0].balance) !== 0) {
    throw new Error("Balance must be zero");
  }

  await appendEvent(accountId, "AccountClosed", {});
}