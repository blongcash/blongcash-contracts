require('dotenv').config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    dev: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    het: {
      provider: () => new HDWalletProvider([process.env.PK], process.env.HECO_HOST_TEST, 0, 2),
      network_id: 256,
      gasPrice: 2e9, // 10 gwei
      gas: 6900000
    },
    hem: {
      provider: () => new HDWalletProvider([process.env.PK_MAINNET], process.env.HECO_HOST_MAINNET, 0, 2),
      network_id: 128,
      gasPrice: 2e9, // 2 gwei
      gas: 12000000
    },
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },
  compilers: {
    solc: {
      version: '0.6.12+commit.27d51765', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
      //  evmVersion: "byzantium"
      }
    },
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
