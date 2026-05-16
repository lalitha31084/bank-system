export async function updateProjections(client: any, event: any) {
    try {
        const { event_type, aggregate_id, event_data, event_number } = event;

        if (event_type === 'AccountCreated') {
            await client.query(
                `INSERT INTO account_summaries (account_id, owner_name, balance, currency, status, version)
                 VALUES ($1, $2, $3, $4, 'OPEN', $5)`,
                [aggregate_id, event_data.ownerName, event_data.initialBalance, event_data.currency, event_number]
            );
        } 
        
        if (event_type === 'MoneyDeposited' || event_type === 'MoneyWithdrawn') {
            const factor = event_type === 'MoneyDeposited' ? 1 : -1;
            await client.query(
                `UPDATE account_summaries SET balance = balance + $1, version = $2 WHERE account_id = $3`,
                [event_data.amount * factor, event_number, aggregate_id]
            );

            await client.query(
                `INSERT INTO transaction_history (transaction_id, account_id, type, amount, description, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [event_data.transactionId, aggregate_id, event_type.replace('Money', '').toUpperCase(), event_data.amount, event_data.description]
            );
        }
        if (event_type === 'AccountClosed') {
            await client.query(
                `UPDATE account_summaries SET status = 'CLOSED', version = $1 WHERE account_id = $2`,
                [event_number, aggregate_id]
            );
        }
    } catch (error: any) {
        throw new Error(`Failed to update projections: ${error.message}`);
    }
}