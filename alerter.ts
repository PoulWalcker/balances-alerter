import Big from "big.js";
const Web3 = require("web3");
import { AvailableChains, Formatter } from "./checker";

const addressList = require("./address-list.json");

export type ERC20TokenWatchPolicy = {
  name: string;
  chain: string;
  min: number;
  address: string;
};

export type WatchRecord = {
  address: string;
  chains: string[];
  meta?: string;
  erc20?: ERC20TokenWatchPolicy[];
};

export type WatchConfig = {
  timeout: number;
  native_limits: Record<string, number>;
  watch: WatchRecord[];
};

class Encoder {
  static encodeWR(record: WatchRecord, chain: AvailableChains): string {
    return record.address + "_" + chain;
  }

  static decodeWR(key: string): [WatchRecord] {
    const [address, chain] = key.split("_");
    return [
      {
        address,
        chains: [chain],
      },
    ];
  }
}

const contractsABI = {
  ERC20ABI: require("./abi/ERC20.json"),
};

class Checker {
  static async getNativeBalance(
    address: string,
    nodeURL: string
  ): Promise<Big> {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));
      let balance = await web3.eth.getBalance(address);
      const res = new Big(balance).div(new Big(10).pow(18));
      return res;
    } catch (err) {
      console.log({ err, address, nodeURL });
    }
    return new Big(0);
  }

  static async getTokenBalanceAndDecimals(
    tokenAddress: string,
    address: string,
    nodeURL: string
  ): Promise<{
    balance: typeof Big;
    decimals: number;
    floatBalance: number;
  } | null> {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));
      const contract = new web3.eth.Contract(
        contractsABI.ERC20ABI,
        tokenAddress
      );
      const balance = await contract.methods.balanceOf(address).call();

      const decimals = await contract.methods.decimals.call().call();
      const floatBalance = new Big(balance).div(
        new Big(10).pow(Number(decimals))
      );

      return { balance, decimals, floatBalance: floatBalance.toNumber() };
    } catch (err) {
      console.log({ err, address, nodeURL });
    }

    return null;
  }

  static async isBalanceBelowLimit(
    balance: Big,
    chain: AvailableChains,
    cfg: WatchConfig
  ): Promise<[boolean, Big]> {
    const alertBelowLimit = Formatter.alertBelowLimit(cfg, chain);
    return [balance.lte(alertBelowLimit), alertBelowLimit];
  }
}

export class Alerter {
  bot: any;
  cfg: WatchConfig;
  cycle: number | NodeJS.Timeout;

  notified: Record<string, number>;

  targetChat: string;

  constructor(bot: any, targetChat: string) {
    this.bot = bot;

    this.cfg = addressList;
    this.targetChat = targetChat;
  }

  beenNotified(record: WatchRecord, chain: AvailableChains): boolean {
    const encoded = Encoder.encodeWR(record, chain);

    return this.notified[encoded] !== undefined;
  }

  async checkAll() {
    console.log("\n Checking....\n");
    const watchable = this.cfg.watch;

    // #1 check native balances
    for (let i = 0; i < watchable.length; i++) {
      const watchRecord = watchable[i];

      const watchableChains = watchRecord.chains;

      for (let j = 0; j < watchableChains.length; j++) {
        const watchChain = watchableChains[j];

        const formattedChain = Formatter.fromCommand(watchChain);

        // if (!Formatter.isEVM(formattedChain)) {
        //   continue;
        // }

        const nodeURL = Formatter.nodeProvider(watchChain);

        const balance = await Checker.getNativeBalance(
          watchRecord.address,
          nodeURL
        );

        const [isBalanceBelowLimit, belowLimitBalance] =
          await Checker.isBalanceBelowLimit(balance, formattedChain, this.cfg);

        if (!isBalanceBelowLimit) {
          continue;
        }
        await this.notify(
          watchRecord.address,
          watchChain,
          balance.toNumber(),
          belowLimitBalance.toNumber(),
          watchRecord.meta
        );
      }

      if (!watchRecord.erc20) {
        continue;
      }

      // #2 now check erc20
      for (let j = 0; j < watchRecord.erc20.length; i++) {
        const record = watchRecord.erc20[j];
        const token = record.address;

        const nodeURL = Formatter.nodeProvider(record.chain);

        const { floatBalance } = await Checker.getTokenBalanceAndDecimals(
          token,
          watchRecord.address,
          nodeURL
        );

        const isBalanceBelowLimit = floatBalance < record.min;

        if (!isBalanceBelowLimit) {
          continue;
        }

        await this.notify(
          watchRecord.address,
          record.chain,
          floatBalance,
          record.min,
          watchRecord.meta
        );
      }
    }
  }

  async simpleNotify(message: string) {
    console.log({ chat: this.targetChat });
    await this.bot.sendMessage(this.targetChat, message);
    console.log(this.targetChat, message);
  }

  async notify(
    address: string,
    chain: string,
    currentBalance: number,
    limitBalance: number,
    meta: string
  ) {
    let message = `
      ${address} balance dropped below limit.
      Chain: ${chain}
      Has: ${currentBalance}
      Limit: ${limitBalance}
      Meta Info: ${meta}
    `;
    message = message
      .split("\n")
      .map((x) => x.trim())
      .join("\n");

    console.log({ message });

    await this.bot.sendMessage(this.targetChat, message);
  }

  async start() {
    const updateFunction = this.checkAll.bind(this);
    this.cycle = setInterval(updateFunction, this.cfg.timeout * 1000);

    await this.simpleNotify(
      `The bot will check provided addresses (EVM only atm) every ${this.cfg.timeout} seconds`
    );

    await this.checkAll();
  }
}
