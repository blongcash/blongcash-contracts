const { cashPools, INITIAL_CASH_FOR_POOLS } = require('./pools');

// Pools
// deployed first
const Cash = artifacts.require('Cash')
const InitialCashDistributor = artifacts.require('InitialCashDistributor');

// ============ Main Migration ============

module.exports = async (deployer, network, accounts) => {
  if (cashPools.length <= 0) return;
  const unit = web3.utils.toBN(10 ** 18);
  const initialCashAmount = unit.muln(INITIAL_CASH_FOR_POOLS).toString();

  const cash = await Cash.deployed();
  const pools = cashPools.map(({contractName}) => artifacts.require(contractName));

  await deployer.deploy(
    InitialCashDistributor,
    cash.address,
    pools.map(p => p.address),
    initialCashAmount,
  );
  const distributor = await InitialCashDistributor.deployed();

  console.log(`Setting distributor to InitialCashDistributor (${distributor.address})`);
  for await (const poolInfo of pools) {
    const pool = await poolInfo.deployed()
    await pool.setRewardDistribution(distributor.address);
  }

  await cash.mint(distributor.address, initialCashAmount);
  console.log(`Deposited ${INITIAL_CASH_FOR_POOLS} CASH to InitialCashDistributor.`);

  await distributor.distribute();
}
