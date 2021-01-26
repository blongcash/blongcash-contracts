const {
  sharePools,
  INITIAL_SHARE_FOR_USD_CASH,
  INITIAL_SHARE_FOR_USD_SHARE,
} = require('./pools');

// Pools
// deployed first
const Share = artifacts.require('Share');
const InitialShareDistributor = artifacts.require('InitialShareDistributor');

// ============ Main Migration ============

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);
  const totalBalanceForUSDCASH = unit.muln(INITIAL_SHARE_FOR_USD_CASH)
  const totalBalanceForUSDSHARE = unit.muln(INITIAL_SHARE_FOR_USD_SHARE)
  const totalBalance = totalBalanceForUSDCASH.add(totalBalanceForUSDSHARE);

  const share = await Share.deployed();

  const lpPoolUSDCASH = artifacts.require(sharePools.USDCASH.contractName);
  const lpPoolUSDSHARE = artifacts.require(sharePools.USDSHARE.contractName);

  await deployer.deploy(
    InitialShareDistributor,
    share.address,
    lpPoolUSDCASH.address,
    totalBalanceForUSDCASH.toString(),
    lpPoolUSDSHARE.address,
    totalBalanceForUSDSHARE.toString(),
  );
  const distributor = await InitialShareDistributor.deployed();

  await share.mint(distributor.address, totalBalance.toString());
  console.log(`Deposited ${INITIAL_SHARE_FOR_USD_CASH} SHARE to InitialShareDistributor.`);

  console.log(`Setting distributor to InitialShareDistributor (${distributor.address})`);
  await lpPoolUSDCASH.deployed().then(pool => pool.setRewardDistribution(distributor.address));
  await lpPoolUSDSHARE.deployed().then(pool => pool.setRewardDistribution(distributor.address));

  await distributor.distribute();
}

module.exports = migration;
