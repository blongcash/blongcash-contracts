const knownContracts = require('./known-contracts');
const { POOL_START_DATE } = require('./pools');

const Cash = artifacts.require('Cash');
const Share = artifacts.require('Share');
const Oracle = artifacts.require('Oracle');
const MockUsd = artifacts.require('MockUsd');
const IERC20 = artifacts.require('IERC20');

const USDCASHLPToken_SHAREPool = artifacts.require('USDCASHLPTokenSharePool')
const USDSHARELPToken_SHAREPool = artifacts.require('USDSHARELPTokenSharePool')

const UniswapV2Factory = artifacts.require('UniswapV2Factory');

module.exports = async (deployer, network, accounts) => {
  const uniswapFactory = ['dev'].includes(network)
    ? await UniswapV2Factory.deployed()
    : await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
  const usdToken = network !== 'dev'
    ? await IERC20.at(knownContracts.USDT[network])
    : await MockUsd.deployed();

  const oracle = await Oracle.deployed();

  const usdToken_cash_lpt = await oracle.pairFor(uniswapFactory.address, Cash.address, usdToken.address);
  const usdToken_share_lpt = await oracle.pairFor(uniswapFactory.address, Share.address, usdToken.address);

  await deployer.deploy(USDCASHLPToken_SHAREPool, Share.address, usdToken_cash_lpt, POOL_START_DATE);
  await deployer.deploy(USDSHARELPToken_SHAREPool, Share.address, usdToken_share_lpt, POOL_START_DATE);
};
