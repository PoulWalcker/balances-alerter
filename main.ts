import { Alerter } from "./alerter";
// const Alerter = require("./alerter.ts");
const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

// replace the value below with the Telegram token you receive from @BotFather
const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_CHAT = process.env.TARGET_CHAT;

async function main() {
  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  const alerter = new Alerter(bot, TARGET_CHAT);

  await alerter.start();
}

main();
