import { pool } from "../common/db";
import { v4 as uuidv4 } from "uuid";

export async function appendEvent(
  aggregateId: string,
  eventType: string,
  eventData: any
): Promise<number> {

  const result = await pool.query(
    "SELECT MAX(event_number) AS num FROM events WHERE aggregate_id=$1",
    [aggregateId]
  );

  const eventNumber = (result.rows[0].num || 0) + 1;

  await pool.query(
    `INSERT INTO events 
    (event_id, aggregate_id, aggregate_type, event_type, event_data, event_number)
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      uuidv4(),
      aggregateId,
      "BankAccount",
      eventType,
      eventData,
      eventNumber
    ]
  );

  return eventNumber;
}