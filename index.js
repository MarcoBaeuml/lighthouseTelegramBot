process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const dateFormater = require('date-and-time');
const glob = require("glob")

const token = '1898235019:AAFWytR_4QaPP_zjkSIXwcaGoKBO3zzTD4E';
const bot = new TelegramBot(token, {polling: true});
let date = new Date();
date = dateFormater.format(date, 'YYYY-MM-DD_HH-mm');
let filename;
let option;
let validCommand = true;
let url;

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  switch (msg.text) {
    case "/desktop":
      validCommand = true;
      option = "desktop";
      break;
    case "/mobile":
      validCommand = true;
      option = "mobile";
      break;
    default:
      validCommand = false;
      const url = msg.text.split(' ');
      if (url[0] == "/url") {
        fs.writeFileSync("url.txt", url[1]);
      }else{
        bot.sendMessage(chatId, "Invalid Command");
      }
      break;
  }
  if (validCommand) {
    bot.sendMessage(chatId, "Lighthouse is warming up...");
    url = fs.readFileSync('url.txt', 'utf8')
    filename = option+"_"+date+".html";
    executeLighthouse().then(()=>{
      bot.sendDocument(chatId, filename); 
      fs.unlinkSync(filename);
    });
  };
});

async function executeLighthouse(){
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: ['performance', 'accessibility','best-practices', 'seo'], port: chrome.port};
  const runnerResult = await lighthouse(url, options);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await chrome.kill();
};
