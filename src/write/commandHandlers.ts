import { appendEvent, loadAggregate } from "./eventStore";
import { pool } from "../common/db";

export async function createAccount(cmd: any): Promise<void> {

  const { accountId, ownerName, initialBalance, currency } = cmd;

  const { state } = await loadAggregate(accountId);

  if (state) {
    throw new Error("Account already exists");
  }

  await appendEvent(accountId, "AccountCreated", {
    accountId,
    ownerName,
    initialBalance,
    currency
  }, 0);
}

export async function deposit(accountId: string, cmd: any): Promise<void> {

  if (cmd.amount <= 0) {
    throw new Error("Invalid amount");
  }

  const { state, version } = await loadAggregate(accountId);

  if (!state) {
    throw new Error("Account not found");
  }

  if (state.status === 'CLOSED') {
    throw new Error("Account is closed");
  }

  await appendEvent(accountId, "MoneyDeposited", cmd, version);
}

export async function withdraw(accountId: string, cmd: any): Promise<void> {

  const { state, version } = await loadAggregate(accountId);

  if (!state) {
    throw new Error("Account not found");
  }

  if (state.status === 'CLOSED') {
    throw new Error("Account is closed");
  }

  if (state.balance < cmd.amount) {
    throw new Error("Insufficient funds");
  }

  await appendEvent(accountId, "MoneyWithdrawn", cmd, version);
}

export async function closeAccount(accountId: string): Promise<void> {

  const { state, version } = await loadAggregate(accountId);

  if (!state) {
    throw new Error("Account not found");
  }

  if (state.balance !== 0) {
    throw new Error("Balance must be zero");
  }

  if (state.status === 'CLOSED') {
    throw new Error("Account is already closed");
  }

  await appendEvent(accountId, "AccountClosed", {}, version);
}