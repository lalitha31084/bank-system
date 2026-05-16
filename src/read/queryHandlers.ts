import { pool } from "../common/db";
import { applyEvents } from "./domain/aggregate";
import { updateProjections } from "./projectors";

export async function getAccount(accountId: string) {

  const result = await pool.query(
    "SELECT * FROM account_summaries WHERE account_id=$1",
    [accountId]
  );

  return result.rows[0];
}

export async function getTransactions(
  accountId: string,
  page: number = 1,
  pageSize: number = 10
) {

  const offset = (page - 1) * pageSize;

  const items = await pool.query(
    `SELECT * FROM transaction_history
     WHERE account_id=$1
     ORDER BY timestamp DESC
     LIMIT $2 OFFSET $3`,
    [accountId, pageSize, offset]
  );

  const count = await pool.query(
    "SELECT COUNT(*) FROM transaction_history WHERE account_id=$1",
    [accountId]
  );

  const totalCount = parseInt(count.rows[0].count);

  return {
    currentPage: page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    items: items.rows
  };
}

export async function getEvents(accountId: string) {
  const result = await pool.query(
    "SELECT event_id AS \"eventId\", event_type AS \"eventType\", event_number AS \"eventNumber\", event_data AS data, timestamp FROM events WHERE aggregate_id=$1 ORDER BY event_number ASC",
    [accountId]
  );
  return result.rows;
}

export async function getBalanceAt(accountId: string, timestamp: string) {
  const result = await pool.query(
    "SELECT * FROM events WHERE aggregate_id=$1 AND timestamp <= $2 ORDER BY event_number ASC",
    [accountId, timestamp]
  );

  const state = applyEvents(result.rows);
  return {
    accountId,
    balanceAt: state.balance,
    timestamp
  };
}

export async function rebuildProjections() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Clear projection tables
    await client.query("TRUNCATE TABLE account_summaries, transaction_history");
    
    // Read all events ordered by global timestamp/event_number
    const eventsRes = await client.query("SELECT * FROM events ORDER BY timestamp ASC, event_number ASC");
    
    for (const row of eventsRes.rows) {
      await updateProjections(client, row);
    }
    
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getProjectionsStatus() {
  const totalEventsRes = await pool.query("SELECT COUNT(*) FROM events");
  const totalEventsInStore = parseInt(totalEventsRes.rows[0].count);

  // For lag calculation, we might assume synchronous processing means lag is 0,
  // but to be safe, we can check max versions if needed. Since we use synchronous projections, lag is 0.
  return {
    totalEventsInStore,
    projections: [
      {
        name: "AccountSummaries",
        lastProcessedEventNumberGlobal: totalEventsInStore,
        lag: 0
      },
      {
        name: "TransactionHistory",
        lastProcessedEventNumberGlobal: totalEventsInStore,
        lag: 0
      }
    ]
  };
}