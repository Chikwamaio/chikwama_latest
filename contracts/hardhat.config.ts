import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config();
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};


module.exports = {
  networks: {
    regtest: {
      url: 'http://127.0.0.1:4444',
      chainId: 33,
      accounts: [process.env.PK]
    },
      goerli: {
          url: "https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY",
          accounts: [process.env.PK]
      }
  },
  solidity: "0.8.20"
};

export default config;
