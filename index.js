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

const longdate = new Date();
const date = dateFormater.format(longdate, "YYYY-MM-DD_HH-mm");
let data = fs.readJsonSync("./data.json");
const bot = new TelegramBot(data.token, { polling: true });

bot.on("message", (apiJson) => {
  const chatId = apiJson.chat.id;
  usrNr = checkUsrReg(chatId);
  if (usrNr < 0) {
    console.log("Denied: " + apiJson.from.first_name + " " + chatId);
    return;
  }
  const msg = apiJson.text;
  switch (true) {
    case msg == "/help":
    case msg == "/start":
      onHelporStart(chatId);
      break;
    case /url(.*)/.test(msg):
      onUrl(chatId, msg, usrNr);
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
  usrNr = checkUsrReg(chatId);
  if (usrNr < 0) {
    console.log("Denied: " + callbackQuery.from.first_name + " " + chatId);
    return;
  }
  const msg = callbackQuery.data;
  switch (true) {
    case msg == "desktop":
    case msg == "mobile":
      onDesktopOrMobile(chatId, msg, usrNr);
      break;
  }
});

function checkUsrReg(chatId) {
  data = fs.readJsonSync("./data.json");
  let usrInd = -1;
  for (let i = 0; i < data.user.length; i++) {
    if (data.user[i].id == chatId) {
      usrInd = i;
    }
  }
  return usrInd;
}

// on message functions

function onHelporStart(chatId) {
  bot.sendMessage(
    chatId,
    "<code>/help - print help \n/url - display current url \n/url &#60url&#62 - change url e.g.: /url https://www.google.com" +
      "\n/generate - generate Lighthouse report \n/fact - print random fact</code>",
    { parse_mode: "HTML" }
  );
}

function onUrl(chatId, msg, usrNr) {
  const urlSplt = msg.split(" ");
  if (urlSplt.length == 1) {
    bot.sendMessage(chatId, data.user[usrNr].url);
  } else if (urlSplt.length == 2 && validUrl.isUri(urlSplt[1])) {
    data.user[usrNr].url = urlSplt[1];
    fs.outputJsonSync("./data.json", data, { spaces: 2 });
    bot.sendMessage(chatId, "url has been changed ");
  } else {
    bot.sendMessage(chatId, "url invalid");
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

function onDesktopOrMobile(_chatId, _msg, _usrNr) {
  const chatId = _chatId;
  const msg = _msg;
  const usrNr = _usrNr;
  const filename = msg + "-" + date + ".html";
  generateLighthouse(chatId, msg, usrNr, filename).then(() => {
    sendLighthouseReport(chatId, filename);
  });
}

//other functions

async function generateLighthouse(chatId, msg, usrNr, filename) {
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

async function sendLighthouseReport(chatId, filename) {
  await bot.sendDocument(chatId, filename);
  fs.unlinkSync(filename);
}
