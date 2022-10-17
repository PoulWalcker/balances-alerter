// import Big from 'big.js'
// import Web3 from 'web3'
const Big = require("big.js");
const Web3 = require("web3");

class Checker {
  static async getBalance(address, nodeURL) {
    const provider = new Web3(nodeURL);

    const balance = await provider.eth.getBalance(address);

    console.log({ balance });
    return new Big(balance).div(new Big(10).pow(18));
  }
}

// async function main() {
//   const price = await Checker.getBalance(
//     "0x057c228815Fe06E2360458eFb59050E6163DeCcc",
//     ETHEREUM_NODE
//   );
//   console.log({ price: price.toNumber() });
// }
// main();
