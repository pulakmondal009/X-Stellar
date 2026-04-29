use soroban_sdk::{Env, Address, String, Vec};
use crate::{DataKey, PaymentRecord};

/// Aggregate the total payment amount across multiple expenses.
/// Useful for pool-based settlement calculations.
pub fn aggregate_pool_payments(env: &Env, expense_ids: Vec<String>) -> i128 {
    let mut total: i128 = 0;
    for id in expense_ids.iter() {
        let payments: Vec<PaymentRecord> = env
            .storage()
            .instance()
            .get(&DataKey::ExpensePayments(id))
            .unwrap_or(Vec::new(env));
        for p in payments.iter() {
            total += p.amount;
        }
    }
    total
}
