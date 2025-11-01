require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: [
        "0xc0fd76e992fff19cb5596781fbecd1cd1bc4b8eecdb03d361ce4cc6fd7fadc0a",
      ],
    },
  },
};
