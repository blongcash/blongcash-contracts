const knownContracts = require('./known-contracts');
const { cashPools, POOL_START_DATE } = require('./pools');

// Tokens
// deployed first
const Cash = artifacts.require('Cash');
const MockUsd = artifacts.require('MockUsd');

// ============ Main Migration ============
module.exports = async (deployer, network, accounts) => {
  if (cashPools.length <= 0) return;
  for await (const { contractName, token } of cashPools) {
    const tokenAddress = knownContracts[token][network] || MockUsd.address;
    if (!tokenAddress) {
      // network is mainnet, so MockUsd is not available
      throw new Error(`Address of ${token} is not registered on migrations/known-contracts.js!`);
    }

    const contract = artifacts.require(contractName);
    await deployer.deploy(contract, Cash.address, tokenAddress, POOL_START_DATE);
  }
};
