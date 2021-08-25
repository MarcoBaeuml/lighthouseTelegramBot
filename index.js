process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const lighthouse = require("lighthouse");
const dateFormater = require("date-and-time");
const configDesktop = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const configMobile = require("lighthouse/lighthouse-core/config/lr-mobile-config.js");
const WikiFakt = require("wikifakt");
const puppeteer = require("puppeteer");
const validUrl = require("valid-url");

let data = fs.readJsonSync("./data.json");
const bot = new TelegramBot(data.token, { polling: true });

let chatId, msg, name, usrNr, date;

bot.on("message", (apiJson) => {
  chatId = apiJson.chat.id;
  msg = apiJson.text;
  name = apiJson.from.first_name;
  usrNr = getUsrNr();
  date = getDateTime();
  console.log(date + ": " + chatId + " " + name + ", " + usrNr + ", message: '" + msg + "'");
  if (usrNr == -1) {
    return;
  }
  switch (true) {
    case msg == "/help":
    case msg == "/start":
      onHelporStart();
      break;
    case /\/url(.*)/.test(msg):
      onUrl();
      break;
    case msg == "/generate":
      onGenerate();
      break;
    case msg == "/fact":
      onFact();
      break;
    default:
      bot.sendMessage(chatId, "invalid command");
      break;
  }
});

bot.on("callback_query", (callbackQuery) => {
  chatId = callbackQuery.from.id;
  msg = callbackQuery.data;
  name = callbackQuery.from.first_name;
  usrNr = getUsrNr();
  date = getDateTime();
  console.log(
    date + ": " + chatId + " " + name + ", " + usrNr + ", callback message: '" + msg + "'"
  );
  if (usrNr == -1) {
    return;
  }
  switch (true) {
    case msg == "desktop":
    case msg == "mobile":
      onDesktopOrMobile();
      break;
  }
});

// on message functions

function onHelporStart() {
  bot.sendMessage(
    chatId,
    "<code>/help - print help \n/url - display current url \n/url &#60url&#62 - change url e.g.: /url https://www.google.com" +
      "\n/generate - generate Lighthouse report \n/fact - print random fact</code>",
    { parse_mode: "HTML" }
  );
}

function onUrl() {
  const url = msg.split(" ");
  data = fs.readJsonSync("./data.json");
  if (url.length == 1) {
    bot.sendMessage(chatId, "current url: " + data.user[usrNr].url);
  } else if (url.length == 2 && validUrl.isUri(url[1])) {
    data.user[usrNr].url = url[1];
    fs.outputJsonSync("./data.json", data, { spaces: 2 });
    bot.sendMessage(chatId, "url has been changed to " + url[1]);
  } else {
    bot.sendMessage(chatId, url[1] + " is an invalid url");
  }
}

function onGenerate() {
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

function onFact() {
  WikiFakt.getRandomFact().then(function (fact) {
    bot.sendMessage(chatId, fact);
  });
}

// on callback functions

function onDesktopOrMobile() {
  const filename = msg + "_" + date + ".html";
  generateLighthouse(filename).then(() => {
    sendLighthouseReport(filename);
  });
}

//other functions

function getUsrNr() {
  data = fs.readJsonSync("./data.json");
  for (let i = 0; i < data.user.length; i++) {
    if (data.user[i].chatId == chatId) {
      return i;
    }
  }
  return -1;
}

function getDateTime() {
  const longdate = new Date();
  const date = dateFormater.format(longdate, "YYYY-MM-DD_HH-mm");
  return date;
}

async function generateLighthouse(filename) {
  const config = msg == "desktop" ? configDesktop : configMobile;
  bot.sendMessage(chatId, "Lighthouse is warming up...");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const options = {
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: new URL(browser.wsEndpoint()).port,
  };
  const runnerResult = await lighthouse(data.user[usrNr].url, options, config);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await browser.close();
}

async function sendLighthouseReport(filename) {
  await bot.sendDocument(chatId, filename);
  fs.unlinkSync(filename);
}
