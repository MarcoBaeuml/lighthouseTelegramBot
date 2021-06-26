process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const dateFormater = require("date-and-time");

const token = "1898235019:AAHK8TEyGfZOJqnHEzH-qWMNhhni8hmudew";
const bot = new TelegramBot(token, { polling: true });
let longdate = new Date();
date = dateFormater.format(longdate, "YYYY-MM-DD_HH-mm");

bot.on("message", (msgjson) => {
  const chatId = msgjson.chat.id;
  const msg = msgjson.text;
  switch (true) {
    case msg == "/help":
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
    "/help - print help\n /url - display current url\n /url <url> - change url\n /generate - generate Lighthouse report"
  );
}

function onUrl(chatId, msg) {
  const urlCommandSplitted = msg.split(" ");
  if (urlCommandSplitted.length == 1) {
    const urlJason = fs.readJsonSync("url.json");
    bot.sendMessage(chatId, urlJason.url);
  } else if (urlCommandSplitted.length == 2) {
    fs.outputJsonSync("url.json", { url: urlCommandSplitted[1] });
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
  bot.sendMessage(chatId, "Lighthouse is warming up...");
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: chrome.port,
  };
  const urlJason = await fs.readJsonSync("url.json");
  const runnerResult = await lighthouse(urlJason.url, options);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await chrome.kill();
}

async function sendLighthouseReport(chatId, filename) {
  await bot.sendDocument(chatId, filename);
  fs.unlinkSync(filename);
}
