process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const dateFormater = require("date-and-time");
const tokenJson = require("./token.json");
const configDesktop = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const configMobile = require("lighthouse/lighthouse-core/config/lr-mobile-config.js");
const puppeteer = require("puppeteer");

const token = tokenJson.token;
const bot = new TelegramBot(token, { polling: true });
let longdate = new Date();
date = dateFormater.format(longdate, "YYYY-MM-DD_HH-mm");

bot.on("message", (msgjson) => {
  const chatId = msgjson.chat.id;
  const msg = msgjson.text;
  switch (true) {
    case msg == "/help":
    case msg == "/start":
      onHelp(chatId);
      break;
    case /url(.*)/.test(msg):
      onUrl(chatId, msg);
      break;
    case msg == "/generate":
      onGenerate(chatId);
      break;
    default:
      bot.sendMessage(chatId, "Invalid Command");
      break;
  }
});

bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.from.id;
  const device = callbackQuery.data;
  const filename = device + "-" + date + ".html";
  generateLighthouse(chatId, filename, device).then(() => {
    sendLighthouseReport(chatId, filename);
  });
});

function onHelp(chatId) {
  bot.sendMessage(
    chatId,
    "/help ==> print help\n /url ==> display current url\n /url <url> ==> change url e.g.: /url https://www.google.com\n /generate ==> generate Lighthouse report"
  );
}

function onUrl(chatId, msg) {
  const urlCommandSplitted = msg.split(" ");
  if (urlCommandSplitted.length == 1) {
    const urlJason = fs.readJsonSync("url.json");
    bot.sendMessage(chatId, urlJason.url);
  } else if (urlCommandSplitted.length == 2) {
    fs.outputJsonSync("url.json", { url: urlCommandSplitted[1] });
    bot.sendMessage(chatId, "url has been changed ");
  }
}

function onGenerate(chatId) {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Desktop",
            callback_data: "desktop",
          },
          {
            text: "Mobile",
            callback_data: "mobile",
          },
        ],
      ],
    },
  };
  bot.sendMessage(chatId, "Select device for lighthouse report ", opts);
}

async function generateLighthouse(chatId, filename, device) {
  let config;
  if (device == "desktop") {
    config = configDesktop;
  } else if (device == "mobile") {
    config = configMobile;
  }
  bot.sendMessage(chatId, "Lighthouse is warming up...");
  const browser = await puppeteer.launch({ headless: true });
  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: new URL(browser.wsEndpoint()).port,
    disableDeviceEmulation: true,
    chromeFlags: ["--disable-mobile-emulation", "--disable-storage-reset"],
  };

  const urlJason = await fs.readJsonSync("url.json");
  const runnerResult = await lighthouse(urlJason.url, options, config);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await browser.close();
}

async function sendLighthouseReport(chatId, filename) {
  await bot.sendDocument(chatId, filename);
  fs.unlinkSync(filename);
}
