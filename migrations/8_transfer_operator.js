const Boardroom = artifacts.require('Boardroom');
const Treasury = artifacts.require('Treasury');
const Cash = artifacts.require('Cash');
const Bond = artifacts.require('Bond');
const Share = artifacts.require('Share');
const Timelock = artifacts.require('Timelock');
const { read } = require('./util');

const DAY = 86400;

module.exports = async (deployer, network, accounts) => {
  const cash = await Cash.deployed();
  const share = await Share.deployed();
  const bond = await Bond.deployed();
  const treasury = await Treasury.deployed();
  const timelock = await deployer.deploy(Timelock, accounts[0], 2 * DAY);

  const boardroomStr = await read(`../build/boardrooms.${network}.json`);
  const { shareBoardroomAddress, lpBoardroomAddress } = JSON.parse(boardroomStr);
  const shareBoardroom = await Boardroom.at(shareBoardroomAddress);
  const lpBoardroom = await Boardroom.at(lpBoardroomAddress);

  for await (const contract of [ cash, share, bond ]) {
    await contract.transferOperator(treasury.address);
    await contract.transferOwnership(treasury.address);
  }
  await shareBoardroom.transferOperator(treasury.address);
  await shareBoardroom.transferOwnership(timelock.address);
  await lpBoardroom.transferOperator(treasury.address);
  await lpBoardroom.transferOwnership(timelock.address);
  await treasury.transferOperator(timelock.address);
  await treasury.transferOwnership(timelock.address);

  console.log(`Transferred the operator role from the deployer (${accounts[0]}) to Treasury (${Treasury.address})`);
}
