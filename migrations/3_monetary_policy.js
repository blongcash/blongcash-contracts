const { POOL_START_DATE } = require('./pools');
const knownContracts = require('./known-contracts');
const { write } = require('./util');

const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const IERC20 = artifacts.require('IERC20');
const MockUsd = artifacts.require('MockUsd');

const Oracle = artifacts.require('Oracle');
const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const SimpleERCFund = artifacts.require('SimpleERCFund');

const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

async function migration(deployer, network, accounts) {
  let uniswap, uniswapRouter;
  if (['dev'].includes(network)) {
    console.log('Deploying uniswap on dev network.');
    await deployer.deploy(UniswapV2Factory, accounts[0]);
    uniswap = await UniswapV2Factory.deployed();

    await deployer.deploy(UniswapV2Router02, uniswap.address, accounts[0]);
    uniswapRouter = await UniswapV2Router02.deployed();
  } else {
    uniswap = await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
    uniswapRouter = await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]);
  }

  const usdToken = network !== 'dev'
    ? await IERC20.at(knownContracts.USDT[network])
    : await MockUsd.deployed();
  // 2. provide liquidity
  // if you don't provide liquidity to pair after step 1 and before step 3,
  //  creating Oracle will fail with NO_RESERVES error.
  const unit = web3.utils.toBN('3000000000000000000').toString(); // 3
  const unitB = web3.utils.toBN('30000000000000000000').toString(); // 30
  const unitShare = web3.utils.toBN('1000000000000000000').toString(); // 1
  const unitShareB = web3.utils.toBN('100000000000000000000').toString(); // 100
  const max = web3.utils.toBN(10 ** 18).muln(10000).toString();

  const cash = await Cash.deployed();
  const share = await Share.deployed();

  console.log('Approving Uniswap on tokens for liquidity');
  await Promise.all([
    approveIfNot(cash, accounts[0], uniswapRouter.address, max),
    approveIfNot(share, accounts[0], uniswapRouter.address, max),
    approveIfNot(usdToken, accounts[0], uniswapRouter.address, max),
  ]);

  // WARNING: msg.sender must hold enough token to add liquidity to pools
  // otherwise transaction will revert
  console.log('Adding liquidity to pools');
  await uniswapRouter.addLiquidity(
    cash.address, usdToken.address, unit, unitB, unit, unitB, accounts[0], deadline(),
  );
  await uniswapRouter.addLiquidity(
    share.address, usdToken.address, unitShare, unitShareB, unitShare, unitShareB, accounts[0],  deadline(),
  );
  
  const usdTokenSharePairAddr = await uniswap.getPair(usdToken.address, share.address);
  const usdTokenCashPairAddr = await uniswap.getPair(usdToken.address, cash.address);
  console.log(`USD-CASH pair address: ${usdTokenCashPairAddr}`);
  console.log(`USD-SHARE pair address: ${usdTokenSharePairAddr}`);

  // Deploy share boardroom
  const shareBoardroom = await deployer.deploy(Boardroom, cash.address, share.address);

  // Deploy lp boardroom
  const lpBoardroom = await deployer.deploy(Boardroom, cash.address, usdTokenSharePairAddr);

  const boardroomAddresses = {
    shareBoardroomAddress: shareBoardroom.address,
    lpBoardroomAddress: lpBoardroom.address,
    usdCashLpPairAddress: usdTokenCashPairAddr,
    usdShareLpPairAddress: usdTokenSharePairAddr,
  };
  await write(`../build/boardrooms.${network}.json`, boardroomAddresses);
  
  // 2. Deploy oracle for the pair between cash and usdToken
  await deployer.deploy(
    Oracle,
    uniswap.address,
    cash.address,
    usdToken.address,
    HOUR*8,
    POOL_START_DATE,
  );
  
  // deploy SimpleFund
  const simpleFund = await deployer.deploy(SimpleERCFund);

  let startTime = POOL_START_DATE;
  if (network === 'hem') {
    startTime += 9 * HOUR;
  }

  await deployer.deploy(
    Treasury,
    cash.address,
    Bond.address,
    Share.address,
    Oracle.address,
    Oracle.address,
    shareBoardroom.address,
    lpBoardroom.address,
    simpleFund.address,
    startTime,
  );
}

async function approveIfNot(token, owner, spender, amount) {
  const allowance = await token.allowance(owner, spender);
  if (web3.utils.toBN(allowance).gte(web3.utils.toBN(amount))) {
    return;
  }
  await token.approve(spender, amount);
  console.log(` - Approved ${token.symbol ? (await token.symbol()) : token.address}`);
}

function deadline() {
  // 30 minutes
  return Math.floor(new Date().getTime() / 1000) + 1800;
}

module.exports = migration;