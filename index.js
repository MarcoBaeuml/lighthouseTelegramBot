process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const lighthouse = require("lighthouse");
const dateFormater = require("date-and-time");
const tokenJson = require("./token.json");
const configDesktop = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const configMobile = require("lighthouse/lighthouse-core/config/lr-mobile-config.js");
const WikiFakt = require("wikifakt");
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
      onHelporStart(chatId);
      break;
    case /url(.*)/.test(msg):
      onUrl(chatId, msg);
      break;
    case msg == "/generate":
      onGenerate(chatId);
      break;
    case msg == "/fact":
      onFact(chatId);
      break;
    default:
      bot.sendMessage(chatId, "Invalid Command");
      break;
  }
});

bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.from.id;
  const msg = callbackQuery.data;
  switch (true) {
    case msg == "desktop":
    case msg == "mobile":
      onDesktopOrMobile(chatId, msg);
      break;
  }
});

// on message functions

function onHelporStart(chatId) {
  bot.sendMessage(
    chatId,
    "<code>/help - print help \n/url - display current url \n/url &#60url&#62 - change url e.g.: /url https://www.google.com" +
      "\n/generate - generate Lighthouse report \n/fact - print random fact</code>",
    { parse_mode: "HTML" }
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

function onFact(chatId) {
  WikiFakt.getRandomFact().then(function (fact) {
    bot.sendMessage(chatId, fact);
  });
}

// on callback functions

function onDesktopOrMobile(_chatId, msg) {
  const chatId = _chatId;
  const device = msg;
  const filename = device + "-" + date + ".html";
  generateLighthouse(chatId, filename, device).then(() => {
    sendLighthouseReport(chatId, filename);
  });
}

//other functions

async function generateLighthouse(chatId, filename, device) {
  const config = device == "desktop" ? configDesktop : configMobile;
  bot.sendMessage(chatId, "Lighthouse is warming up...");
  const browser = await puppeteer.launch({ headless: true });
  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: new URL(browser.wsEndpoint()).port,
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
