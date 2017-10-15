
// 86400 is num seconds in day
const timeTravel = (time) => web3.currentProvider.send({
  jsonrpc: "2.0", method: "evm_increaseTime",
  params: [time], id: new Date().getTime()
})

const mineBlock = () => web3.currentProvider.send({
  jsonrpc: "2.0", method: "evm_mine"
})

const skipDays = days => {
 timeTravel(days*86400+60);
 mineBlock();
}

module.exports = { skipDays: skipDays }
