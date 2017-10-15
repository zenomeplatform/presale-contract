module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      host: "localhost", // Connect to geth on the specified
      port: 8545,
      from: "0xb36F1b86d18F15482b7f79183Eee1f64deAFF35E", // default address to use for any transaction Truffle makes during migrations
      // /Users/user_name/Library/Application\ Support/Mist/binaries/Geth/unpacked/geth --rinkeby --rpc --rpcapi db,eth,net,web3,personal --unlock="0xb36F1b86d18F15482b7f79183Eee1f64deAFF35E"
      network_id: 4,
      gas: 4612388 // Gas limit used for deploys
    },
    mainnet: {
      host: "localhost", // Connect to geth on the specified
      port: 8545,
      from: "0x858c9a52826e45150f70abCb0F40d6cD83247490", // default address to use for any transaction Truffle makes during migrations
      // /Users/user_name/Library/Application\ Support/Mist/binaries/Geth/unpacked/geth --rpc --rpcapi db,eth,net,web3,personal --unlock="0x858c9a52826e45150f70abCb0F40d6cD83247490"
      network_id: 1,
      gas: 4612388 // Gas limit used for deploys
    }
  }
};
