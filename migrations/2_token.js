// ============ Contracts ============

// Token
// deployed first
const Cash = artifacts.require('Cash')
const Bond = artifacts.require('Bond')
const Share = artifacts.require('Share')
const MockUsd = artifacts.require('MockUsd');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  await deployer.deploy(Cash);
  await deployer.deploy(Bond);
  await deployer.deploy(Share);

  if (network === 'dev') {
    const usdToken = await deployer.deploy(MockUsd);
    console.log(`MockUSD address: ${usdToken.address}`);
  }
}
