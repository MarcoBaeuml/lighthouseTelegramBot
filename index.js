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
const { fstatSync } = require("fs-extra");

if (process.env.BOT_TOKEN === undefined)
  throw new Error("BOT_TOKEN must be provided!");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const type = { message: "message", callback: "callback" };

const DATA_PATH = "data/data.json",
  WHITELIST_PATH = "data/whitelist.json",
  LOG_PATH = "data/log.txt";

bot.on("message", (api) => {
  const {
    chat: { id: chatId },
    text: msg,
    from: { first_name: usrName },
  } = api;
  const { usrValid, whitelistApplied } = UserValid(chatId);
  log(chatId, msg, usrName, usrValid, whitelistApplied, type.message);
  if (!usrValid) return;

  switch (true) {
    case msg == "/help":
    case msg == "/start":
      onHelporStart(chatId);
      break;
    case /\/url(.*)/.test(msg):
      onUrl(chatId, msg);
      break;
    case msg == "/generate":
      onGenerate(chatId);
      break;
    case msg == "/fact":
      onFact(chatId);
      break;
    default:
      bot.sendMessage(chatId, "invalid command");
      break;
  }
});

bot.on("callback_query", (api) => {
  const {
    from: { id: chatId, first_name: usrName },
    data: msg,
  } = api;
  const { usrValid, whitelistApplied } = UserValid(chatId);
  log(chatId, msg, usrName, usrValid, whitelistApplied, type.callback);
  if (!usrValid) return;

  switch (true) {
    case msg == "desktop":
    case msg == "mobile":
      onDesktopOrMobile(chatId, msg);
      break;
  }
});

function UserValid(chatId) {
  try {
    ({ chatId: whitelisteUsr } = fs.readJsonSync(WHITELIST_PATH));

    return whitelisteUsr.includes(chatId)
      ? { usrValid: true, whitelistApplied: true }
      : { usrValid: false, whitelistApplied: true };
  } catch {
    return { usrValid: true, whitelistApplied: false };
  }
}

function log(chatId, msg, usrName, isValid, whitelistApplied, type) {
  const date = getDateTime();
  const headline =
    "date, name, chatId, usrValid, whitelistApplied, typ, message";
  const data = `${date}, ${usrName}, ${chatId}, ${isValid}, ${whitelistApplied}, ${type}, ${msg}`;

  let logContent = [];
  try {
    logContent = fs.readFileSync(LOG_PATH).toString().split("\n");
  } catch {}

  logContent.push(data);
  logContent.splice(0, logContent.length - 30);
  if (logContent[0] != headline) logContent.unshift(headline);
  logContent = logContent.join("\n");
  fs.outputFile(LOG_PATH, logContent);
}

function getUsrNr(chatId) {
  let data;
  try {
    data = fs.readJSONSync(DATA_PATH);

    for (let i = 0; i < data.users.length; i++) {
      if (data.users[i].chatId == chatId) return i;
    }
    return createNewUsr(chatId, data);
  } catch {
    data = { users: [] };
    return createNewUsr(chatId, data);
  }
}

function createNewUsr(chatId, data) {
  const newUsr = { chatId: chatId, url: "https://www.google.com" };
  data.users.push(newUsr);
  fs.outputJSONSync(DATA_PATH, data, { spaces: 2 });
  return --data.users.length;
}

function getUrl(chatId) {
  const usrNr = getUsrNr(chatId);
  const data = fs.readJSONSync(DATA_PATH);
  return data.users[usrNr].url;
}

function setUrl(chatId, url) {
  const usrNr = getUsrNr(chatId);
  const data = fs.readJSONSync(DATA_PATH);
  data.users[usrNr].url = url;
  fs.outputJSONSync(DATA_PATH, data, { spaces: 2 });
}

function getDateTime() {
  return dateFormater.format(new Date(), "YYYY-MM-DD_HH-mm");
}

function onHelporStart(chatId) {
  bot.sendMessage(
    chatId,
    "<code>/help - print help \n/url - display current url \n/url &#60url&#62 - change url e.g.: /url https://www.google.com" +
      "\n/generate - generate Lighthouse report \n/fact - print random fact</code>",
    { parse_mode: "HTML" }
  );
}

function onUrl(chatId, msg) {
  const url = msg.split(" ");
  if (url.length == 1) {
    bot.sendMessage(chatId, "current url: " + getUrl(chatId));
  } else if (url.length == 2 && validUrl.isUri(url[1])) {
    setUrl(chatId, url[1]);
    bot.sendMessage(chatId, `url has been changed to ${url[1]}`);
  } else {
    bot.sendMessage(chatId, `${url[1]} is an invalid url`);
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

async function onFact(chatId) {
  const fact = await WikiFakt.getRandomFact();
  bot.sendMessage(chatId, fact);
}

async function onDesktopOrMobile(chatId, msg) {
  const date = getDateTime();
  const filename = `${msg}_${date}.html`;
  await generateLighthouse(chatId, msg, filename);
  sendLighthouseReport(chatId, filename);
}

async function generateLighthouse(chatId, msg, filename) {
  const config = msg == "desktop" ? configDesktop : configMobile;
  bot.sendMessage(chatId, "Lighthouse is warming up...");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const options = {
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: new URL(browser.wsEndpoint()).port,
  };
  const runnerResult = await lighthouse(getUrl(chatId), options, config);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await browser.close();
}

async function sendLighthouseReport(chatId, filename) {
  await bot.sendDocument(chatId, filename);
  fs.unlinkSync(filename);
}
