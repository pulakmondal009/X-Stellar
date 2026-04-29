#!/bin/bash
# =============================================
# Stellar-Star: Build & Deploy Soroban Contract
# =============================================
set -e

echo "🔨 Building Soroban contract..."
cd contract
cargo build --target wasm32-unknown-unknown --release

WASM_PATH="target/wasm32-unknown-unknown/release/stellar_star.wasm"

echo "⚡ Optimizing WASM..."
soroban contract optimize --wasm $WASM_PATH

echo "🚀 Deploying to testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_star.optimized.wasm \
  --source $DEPLOYER_KEY \
  --network testnet)

echo "✅ Contract deployed: $CONTRACT_ID"

echo "🔧 Initializing contract..."
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $DEPLOYER_KEY \
  --network testnet \
  -- initialize

echo "🎉 Done! Add to .env.local:"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
