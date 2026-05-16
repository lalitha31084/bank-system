import { pool } from "../common/db";
import { v4 as uuidv4 } from "uuid";
import { updateProjections } from "../read/projectors";
import { applyEvents, AccountState } from "../read/domain/aggregate";

export async function appendEvent(
  aggregateId: string,
  eventType: string,
  eventData: any,
  expectedVersion?: number
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT MAX(event_number) AS num FROM events WHERE aggregate_id=$1",
      [aggregateId]
    );

    const currentVersion = result.rows[0].num || 0;
    
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new Error(`Concurrency exception: expected version ${expectedVersion}, got ${currentVersion}`);
    }

    const eventNumber = currentVersion + 1;
    const eventId = uuidv4();

    await client.query(
      `INSERT INTO events 
      (event_id, aggregate_id, aggregate_type, event_type, event_data, event_number)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        eventId,
        aggregateId,
        "BankAccount",
        eventType,
        eventData,
        eventNumber
      ]
    );

    // Synchronous projection update within the same transaction
    await updateProjections(client, {
      event_id: eventId,
      aggregate_id: aggregateId,
      event_type: eventType,
      event_data: eventData,
      event_number: eventNumber
    });

    // Create snapshot after every 50 events
    if (eventNumber % 50 === 0) {
      // reconstruct state
      const state = await reconstructState(client, aggregateId);
      await client.query(
        `INSERT INTO snapshots (snapshot_id, aggregate_id, snapshot_data, last_event_number, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (aggregate_id) DO UPDATE 
         SET snapshot_data = EXCLUDED.snapshot_data, last_event_number = EXCLUDED.last_event_number, created_at = NOW()`,
        [uuidv4(), aggregateId, state, eventNumber]
      );
    }

    await client.query("COMMIT");
    return eventNumber;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function loadAggregate(aggregateId: string): Promise<{ state: AccountState | undefined, version: number }> {
  // Try to load snapshot first
  const snapshotRes = await pool.query(
    "SELECT snapshot_data, last_event_number FROM snapshots WHERE aggregate_id=$1",
    [aggregateId]
  );

  let state: AccountState | undefined;
  let lastEventNumber = 0;

  if (snapshotRes.rowCount && snapshotRes.rowCount > 0) {
    state = snapshotRes.rows[0].snapshot_data;
    lastEventNumber = snapshotRes.rows[0].last_event_number;
  }

  // Load remaining events
  const eventsRes = await pool.query(
    "SELECT * FROM events WHERE aggregate_id=$1 AND event_number > $2 ORDER BY event_number ASC",
    [aggregateId, lastEventNumber]
  );

  if (eventsRes.rowCount === 0 && !state) {
    return { state: undefined, version: 0 };
  }

  const finalState = applyEvents(eventsRes.rows, state);
  return { state: finalState, version: finalState.version };
}

async function reconstructState(client: any, aggregateId: string): Promise<AccountState> {
  // Try to load snapshot first
  const snapshotRes = await client.query(
    "SELECT snapshot_data, last_event_number FROM snapshots WHERE aggregate_id=$1",
    [aggregateId]
  );

  let state: AccountState | undefined;
  let lastEventNumber = 0;

  if (snapshotRes.rowCount > 0) {
    state = snapshotRes.rows[0].snapshot_data;
    lastEventNumber = snapshotRes.rows[0].last_event_number;
  }

  // Load remaining events
  const eventsRes = await client.query(
    "SELECT * FROM events WHERE aggregate_id=$1 AND event_number > $2 ORDER BY event_number ASC",
    [aggregateId, lastEventNumber]
  );

  return applyEvents(eventsRes.rows, state);
}