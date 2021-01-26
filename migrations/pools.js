const INITIAL_CASH_FOR_POOLS = 50000;
const INITIAL_SHARE_FOR_USD_CASH = 75000;
const INITIAL_SHARE_FOR_USD_SHARE = 25000;

const POOL_START_DATE = Date.parse('2021-01-26T16:00:00Z') / 1000;

const cashPools = [
  // { contractName: 'CASHUSDPool', token: 'USD' },
  // { contractName: 'CASHSUSDPool', token: 'SUSD' },
  // { contractName: 'CASHUSDCPool', token: 'USDC' },
  // { contractName: 'CASHUSDTPool', token: 'USDT' },
  // { contractName: 'CASHyCRVPool', token: 'yCRV' },
];

const sharePools = {
  USDCASH: { contractName: 'USDCASHLPTokenSharePool', token: 'USD_CASH-LPv2' },
  USDSHARE: { contractName: 'USDSHARELPTokenSharePool', token: 'USD_SHARE-LPv2' },
}

module.exports = {
  POOL_START_DATE,
  INITIAL_CASH_FOR_POOLS,
  INITIAL_SHARE_FOR_USD_CASH,
  INITIAL_SHARE_FOR_USD_SHARE,
  cashPools,
  sharePools,
};
