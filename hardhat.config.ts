import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";

import {privateKey} from "./private_key"

import "./tasks/stake";
import "./tasks/unstake";
import "./tasks/claim";
import "./tasks/addRewards";

export default {
  solidity: "0.8.15",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/d02e3468e5a84ad6a12bfe71f356d170",
      accounts: [privateKey]
    }
  },
  etherscan: {
    apiKey: "HR7981SWACJQSXC8X15F4RCSGFEG8IET3Y"
  }
};