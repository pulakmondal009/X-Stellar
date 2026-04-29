#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

pub mod pool;

#[contracttype]
pub enum DataKey {
    Payment(String),
    ExpensePayments(String),
    PoolBalance,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRecord {
    pub expense_id: String,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub tx_hash: String,
}

#[contract]
pub struct StellarStarContract;

#[contractimpl]
impl StellarStarContract {
    /// Record a payment for an expense split.
    /// The payer must authorize this transaction.
    pub fn record_payment(
        env: Env,
        expense_id: String,
        payer: Address,
        payee: Address,
        amount: i128,
        tx_hash: String,
    ) -> bool {
        payer.require_auth();

        let record = PaymentRecord {
            expense_id: expense_id.clone(),
            payer,
            payee,
            amount,
            timestamp: env.ledger().timestamp(),
            tx_hash,
        };

        // Store the latest payment for this expense
        let key = DataKey::Payment(expense_id.clone());
        env.storage().instance().set(&key, &record);

        // Append to the list of all payments for this expense
        let mut payments: Vec<PaymentRecord> = env
            .storage()
            .instance()
            .get(&DataKey::ExpensePayments(expense_id.clone()))
            .unwrap_or(Vec::new(&env));
        payments.push_back(record);
        env.storage()
            .instance()
            .set(&DataKey::ExpensePayments(expense_id), &payments);

        true
    }

    /// Get the latest payment record for an expense.
    pub fn get_payment(env: Env, expense_id: String) -> Option<PaymentRecord> {
        env.storage()
            .instance()
            .get(&DataKey::Payment(expense_id))
    }

    /// Get all payment records for an expense.
    pub fn get_expense_payments(env: Env, expense_id: String) -> Vec<PaymentRecord> {
        env.storage()
            .instance()
            .get(&DataKey::ExpensePayments(expense_id))
            .unwrap_or(Vec::new(&env))
    }

    /// Initialize the contract with a zero pool balance.
    pub fn initialize(env: Env) -> bool {
        env.storage()
            .instance()
            .set(&DataKey::PoolBalance, &0i128);
        true
    }
}
