import Big from "big.js";
import { WatchConfig } from "./alerter";
require("dotenv").config();

const ETHEREUM_NODE = process.env.ETHEREUM_RPC;

export enum AvailableChains {
  Ethereum = 0,
  Gton,
  TestGton,
  Fantom,
  Goerli,
}

export class Formatter {
  static fromCommand(chain: string): AvailableChains | null {
    switch (chain) {
      case "ethereum":
        return AvailableChains.Ethereum;
      case "gton":
        return AvailableChains.Gton;
      case "testGton":
        return AvailableChains.TestGton;
      case "fantom":
        return AvailableChains.Fantom;
      case "goerli":
        return AvailableChains.Goerli;
      default:
        return null;
    }
  }

  static formatCommand(chain: AvailableChains): string | null {
    switch (chain) {
      case AvailableChains.Ethereum:
        return "ethereum";
      case AvailableChains.Gton:
        return "gton";
      case AvailableChains.TestGton:
        return "testGton";
      case AvailableChains.Fantom:
        return "fantom";
      case AvailableChains.Goerli:
        return "goerli";
      default:
        return null;
    }
  }

  static nodeProvider(input_chain: AvailableChains | string): string | null {
    let chain: AvailableChains | string = input_chain;
    if (typeof input_chain === "string") {
      chain = Formatter.fromCommand(input_chain);
      if (chain === null) return null;
    }

    switch (chain) {
      case AvailableChains.Ethereum:
        return `https://mainnet.infura.io/v3/${ETHEREUM_NODE}`;
      case AvailableChains.Gton:
        return "https://rpc.gton.network/";
      case AvailableChains.TestGton:
        return "https://testnet.gton.network/";
      case AvailableChains.Fantom:
        return "https://rpc.ankr.com/fantom";
      case AvailableChains.Goerli:
        return `https://goerli.infura.io/v3/${ETHEREUM_NODE}`;
    }
    return null;
  }

  static alertBelowLimit(cfg: WatchConfig, chain: AvailableChains): Big | null {
    return new Big(cfg.native_limits[Formatter.formatCommand(chain)]!);
  }
}
