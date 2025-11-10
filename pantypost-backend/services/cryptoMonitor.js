// pantypost-backend/services/cryptoMonitor.js
// Automated crypto deposit verification service
// This monitors the Polygon blockchain for USDT/USDC deposits and auto-verifies them

const { Web3 } = require('web3'); // Note: Web3 v4 requires destructuring
const CryptoDeposit = require('../models/CryptoDeposit');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// FREE PUBLIC RPC ENDPOINTS - No API key needed!
const RPC_ENDPOINTS = [
  'https://polygon-rpc.com',
  'https://rpc-mainnet.maticvigil.com',
  'https://polygon-mainnet.public.blastapi.io',
  'https://rpc-mainnet.matic.network',
  'https://matic-mainnet.chainstacklabs.com'
];

// Initialize Web3 with fallback RPCs
let web3;
let currentRpcIndex = 0;

function initializeWeb3() {
  try {
    web3 = new Web3(RPC_ENDPOINTS[currentRpcIndex]);
    console.log(`🌐 Connected to Polygon RPC: ${RPC_ENDPOINTS[currentRpcIndex]}`);
    return true;
  } catch (error) {
    console.error(`Failed to connect to RPC ${currentRpcIndex}:`, error.message);
    currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
    if (currentRpcIndex === 0) {
      console.error('❌ All RPC endpoints failed');
      return false;
    }
    return initializeWeb3(); // Try next endpoint
  }
}

// Contract addresses on Polygon
const CONTRACTS = {
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  // Add MATIC support for testing
  MATIC: 'NATIVE' // Special case for MATIC
};

// Your wallet address from environment
const YOUR_WALLET = (process.env.CRYPTO_WALLET_POLYGON || '0x16305612c67a84fa8ae4cccc50e560b94372d04d').toLowerCase();

// ERC20 Transfer Event ABI (same for USDT and USDC)
const ERC20_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  // Add balanceOf for checking
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

// Track processed transactions to avoid duplicates
const processedTxs = new Set();

// Auto-verify a deposit
async function autoVerifyDeposit(deposit, actualAmount, txHash, fromAddress) {
  try {
    console.log(`🔍 Auto-verifying deposit ${deposit.depositId}`);
    
    // Mark deposit as complete
    await deposit.complete(actualAmount, 'auto-verified', `Auto-verified from ${fromAddress}`);
    
    // Credit the user's wallet
    const userWallet = await Wallet.findOne({ username: deposit.username });
    if (!userWallet) {
      console.error(`Wallet not found for user ${deposit.username}`);
      return false;
    }
    
    const previousBalance = userWallet.balance;
    await userWallet.deposit(deposit.amountUSD);
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'deposit',
      amount: deposit.amountUSD,
      to: deposit.username,
      toRole: userWallet.role,
      description: `Crypto deposit (${deposit.cryptoCurrency}) - Auto-verified`,
      status: 'completed',
      completedAt: new Date(),
      metadata: {
        paymentMethod: 'crypto',
        cryptoCurrency: deposit.cryptoCurrency,
        txHash: txHash,
        depositId: deposit.depositId,
        actualCryptoAmount: actualAmount,
        verifiedBy: 'auto-verification',
        fromAddress: fromAddress
      }
    });
    await transaction.save();
    
    // Emit WebSocket events if available
    if (global.webSocketService) {
      global.webSocketService.emitBalanceUpdate(
        deposit.username,
        userWallet.role,
        previousBalance,
        userWallet.balance,
        'deposit'
      );
      global.webSocketService.emitTransaction(transaction);
      
      // Notify user
      global.webSocketService.emitToUser(deposit.username, 'deposit:verified', {
        depositId: deposit.depositId,
        amount: deposit.amountUSD,
        txHash: txHash
      });
    }
    
    console.log(`✅ Auto-verified deposit ${deposit.depositId}: $${deposit.amountUSD} credited to ${deposit.username}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to auto-verify deposit ${deposit.depositId}:`, error);
    return false;
  }
}

// Check for USDT deposits
async function checkTokenDeposit(tokenSymbol, contractAddress) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);
    
    // Get recent Transfer events to our wallet
    const latestBlock = Number(await web3.eth.getBlockNumber()); // Convert BigInt to Number
    const fromBlock = Math.max(0, latestBlock - 20); // ~1.5 minutes of blocks
    
    const events = await contract.getPastEvents('Transfer', {
      filter: { to: YOUR_WALLET },
      fromBlock: fromBlock,
      toBlock: 'latest'
    });
    
    for (const event of events) {
      const txHash = event.transactionHash;
      
      // Skip if already processed
      if (processedTxs.has(txHash)) continue;
      
      const from = event.returnValues.from;
      const to = event.returnValues.to.toLowerCase();
      const value = event.returnValues.value;
      
      // Convert BigInt to number properly
      const decimals = tokenSymbol === 'USDT' ? 6 : 6; // Both USDT and USDC have 6 decimals on Polygon
      const amount = Number(BigInt(value)) / Math.pow(10, decimals);
      
      console.log(`📥 Found ${tokenSymbol} deposit: ${amount} from ${from} (tx: ${txHash})`);
      
      // Find matching pending deposit
      const deposits = await CryptoDeposit.find({
        status: { $in: ['pending', 'confirming'] },
        cryptoCurrency: `${tokenSymbol}_POLYGON`
      });
      
      for (const deposit of deposits) {
        // Match by amount (within 1% tolerance for fees)
        const expectedAmount = deposit.expectedCryptoAmount;
        const tolerance = expectedAmount * 0.025; // 2.5% tolerance in case of fees
        
        if (Math.abs(amount - expectedAmount) <= tolerance) {
          // Found matching deposit!
          processedTxs.add(txHash);
          
          // Update the deposit with the actual txHash if user didn't provide
          if (!deposit.txHash || deposit.txHash !== txHash) {
            deposit.txHash = txHash;
            await deposit.save();
          }
          
          await autoVerifyDeposit(deposit, amount, txHash, from);
          break;
        }
      }
    }
  } catch (error) {
    console.error(`Error checking ${tokenSymbol} deposits:`, error.message);
    // Try switching RPC endpoint
    if (error.message.includes('CONNECTION') || error.message.includes('TIMEOUT')) {
      console.log('Switching RPC endpoint...');
      currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
      initializeWeb3();
    }
  }
}

// Check for native MATIC deposits (for testing)
async function checkMaticDeposits() {
  try {
    const latestBlock = Number(await web3.eth.getBlockNumber()); // Convert BigInt to Number
    const fromBlock = Math.max(0, latestBlock - 20); // Keep consistent
    
    // Get transactions to our wallet
    for (let i = fromBlock; i <= latestBlock; i++) {
      const block = await web3.eth.getBlock(i, true);
      if (!block || !block.transactions) continue;
      
      for (const tx of block.transactions) {
        if (tx.to && tx.to.toLowerCase() === YOUR_WALLET) {
          const txHash = tx.hash;
          
          // Skip if already processed
          if (processedTxs.has(txHash)) continue;
          
          // Convert BigInt to number properly
          const valueInWei = BigInt(tx.value);
          const amount = Number(web3.utils.fromWei(valueInWei, 'ether'));
          
          if (amount > 0) {
            console.log(`📥 Found MATIC deposit: ${amount} from ${tx.from} (tx: ${txHash})`);
            processedTxs.add(txHash);
            
            // For testing purposes - you can remove this in production
            // Auto-credit any MATIC deposits as if they were USDT
            const deposits = await CryptoDeposit.find({
              status: { $in: ['pending', 'confirming'] }
            });
            
            for (const deposit of deposits) {
              // For testing: match any pending deposit
              if (!deposit.txHash) {
                deposit.txHash = txHash;
                await deposit.save();
                
                console.log(`🧪 TEST MODE: Treating MATIC deposit as ${deposit.cryptoCurrency}`);
                await autoVerifyDeposit(deposit, deposit.expectedCryptoAmount, txHash, tx.from);
                break;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking MATIC deposits:', error.message);
  }
}

// Main monitoring function
async function monitorDeposits() {
  if (!web3) {
    console.log('Web3 not initialized, skipping check...');
    return;
  }
  
  try {
    // Check USDT deposits
    await checkTokenDeposit('USDT', CONTRACTS.USDT);
    
    // Check USDC deposits
    await checkTokenDeposit('USDC', CONTRACTS.USDC);
    
    // Check MATIC deposits (for testing)
    await checkMaticDeposits();
    
  } catch (error) {
    console.error('Error in monitoring cycle:', error);
  }
}

// Clean up old processed transactions (prevent memory leak)
function cleanupProcessedTxs() {
  if (processedTxs.size > 1000) {
    const txArray = Array.from(processedTxs);
    // Keep only last 500 transactions
    processedTxs.clear();
    txArray.slice(-500).forEach(tx => processedTxs.add(tx));
    console.log('🧹 Cleaned up processed transactions cache');
  }
}

// Start monitoring
let monitoringInterval;

function startMonitoring() {
  console.log('🚀 Starting automated crypto deposit monitoring...');
  
  if (!initializeWeb3()) {
    console.error('❌ Failed to initialize Web3, monitoring disabled');
    return false;
  }
  
  console.log(`📍 Monitoring wallet: ${YOUR_WALLET}`);
  console.log('💰 Supported tokens: USDT, USDC, MATIC (for testing)');
  console.log('⏱️  Check interval: Every 30 seconds');
  console.log('🤖 Auto-verification: ENABLED');
  
  // Initial check
  monitorDeposits();
  
  // Check every 30 seconds
  monitoringInterval = setInterval(() => {
    monitorDeposits();
  }, 30 * 1000);
  
  // Cleanup every hour
  setInterval(cleanupProcessedTxs, 60 * 60 * 1000);
  
  return true;
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    console.log('🛑 Stopped crypto monitoring');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  stopMonitoring();
  process.exit();
});

module.exports = {
  startMonitoring,
  stopMonitoring,
  monitorDeposits,
  autoVerifyDeposit
};