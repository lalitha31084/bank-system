import { pool } from "../common/db";

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