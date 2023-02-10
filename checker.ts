import Big from "big.js";
import { WatchConfig } from "./alerter";

export enum AvailableChains {
  Gton = 0,
  TestGton,
  Fantom,
  Bsc,
  TestBsc,
}

export class Formatter {
  static fromCommand(chain: string): AvailableChains | null {
    switch (chain) {
      case "gton":
        return AvailableChains.Gton;
      case "testGton":
        return AvailableChains.TestGton;
      case "fantom":
        return AvailableChains.Fantom;
      case "bsc":
        return AvailableChains.Bsc;
      case "testBsc":
        return AvailableChains.TestBsc;
      default:
        return null;
    }
  }

  static formatCommand(chain: AvailableChains): string | null {
    switch (chain) {
      case AvailableChains.Gton:
        return "gton";
      case AvailableChains.TestGton:
        return "testGton";
      case AvailableChains.Fantom:
        return "fantom";
      case AvailableChains.Bsc:
        return "bsc";
      case AvailableChains.TestBsc:
        return "testBsc";
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
      case AvailableChains.Gton:
        return "https://rpc.gton.network/";
      case AvailableChains.TestGton:
        return "https://testnet.gton.network/";
      case AvailableChains.Fantom:
        return "https://rpc.ankr.com/fantom";
      case AvailableChains.Bsc:
        return "https://bsc-dataseed2.binance.org";
      case AvailableChains.TestBsc:
        return "https://data-seed-prebsc-2-s1.binance.org:8545";
    }
    return null;
  }

  static alertBelowLimit(cfg: WatchConfig, chain: AvailableChains): Big | null {
    return new Big(cfg.native_limits[Formatter.formatCommand(chain)]!);
  }
}
