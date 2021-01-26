const { cashPools, sharePools } = require('./pools');

const { write, read } = require('./util');
const Boardroom = artifacts.require('Boardroom');

function distributionPoolContracts() {
    return fs.readdirSync(path.resolve(__dirname, '../contracts/distribution'))
      .filter(filename => filename.endsWith('Pool.sol'))
      .map(filename => filename.replace('.sol', ''));
}

function getAllPools() {
  const spool = Object.keys(sharePools).map(k => sharePools[k]);
  return [...cashPools, ...spool].map(v => v['contractName']);
}

// Deployment and ABI will be generated for contracts listed on here.
// The deployment thus can be used on frontend.
const exportedContracts = [
  'Cash',
  'Bond',
  'Share',
  'Treasury',
  'Oracle',
  ...getAllPools(),
];

module.exports = async (deployer, network, accounts) => {
  const boardroomStr = await read(`../build/boardrooms.${network}.json`);
  const { shareBoardroomAddress, lpBoardroomAddress, usdCashLpPairAddress, usdShareLpPairAddress } = JSON.parse(boardroomStr);

  const deployments = {
    shareBoardroom: {
      address: shareBoardroomAddress,
      abi: Boardroom.abi
    },
    lpBoardroom: {
      address: lpBoardroomAddress,
      abi: Boardroom.abi
    }
  };
  const addresses = {
    shareBoardroom: {
      address: shareBoardroomAddress,
    },
    lpBoardroom: {
      address: lpBoardroomAddress,
    },
    usdCashLpPairAddress: {
      address: usdCashLpPairAddress
    },
    usdShareLpPairAddress: {
      address: usdShareLpPairAddress
    },
  };

  for (const name of exportedContracts) {
    const contract = artifacts.require(name);
    deployments[name] = {
      address: contract.address,
      abi: contract.abi,
    };

    addresses[name] = {
      address: contract.address,
    };
  }
  
  await write(`../build/deployments.${network}.json`, deployments);
  await write(`../build/addresses.${network}.json`, addresses);
};
