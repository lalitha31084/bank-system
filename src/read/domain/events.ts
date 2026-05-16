export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  eventData: any;
  eventNumber: number;
  timestamp?: string;
}

export interface AccountCreatedEventData {
  accountId: string;
  ownerName: string;
  initialBalance: number;
  currency: string;
}

export interface MoneyDepositedEventData {
  amount: number;
  description: string;
  transactionId: string;
}

export interface MoneyWithdrawnEventData {
  amount: number;
  description: string;
  transactionId: string;
}

export interface AccountClosedEventData {
  reason?: string;
}