require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/b7af010f44bf4fadb949471fb55e5b3f",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
