export interface AccountState {
    accountId: string;
    balance: number;
    status: 'OPEN' | 'CLOSED';
    version: number;
}

export function applyEvents(history: any[], initialState?: AccountState): AccountState {
    let state: AccountState = initialState || { accountId: '', balance: 0, status: 'OPEN', version: 0 };
    
    for (const event of history) {
        state.version = event.event_number;
        switch (event.event_type) {
            case 'AccountCreated':
                state.accountId = event.aggregate_id;
                state.balance = event.event_data.initialBalance;
                break;
            case 'MoneyDeposited':
                state.balance += event.event_data.amount;
                break;
            case 'MoneyWithdrawn':
                state.balance -= event.event_data.amount;
                break;
            case 'AccountClosed':
                state.status = 'CLOSED';
                break;
        }
    }
    return state;
}