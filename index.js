process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const dateFormater = require('date-and-time');

const token = '1898235019:AAFWytR_4QaPP_zjkSIXwcaGoKBO3zzTD4E';
const bot = new TelegramBot(token, {polling: true});
let date = new Date();
date = dateFormater.format(date, 'YYYY-MM-DD_HH-mm');
let filename;
let option;
let validCommand = true;

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  switch (msg.text) {
    case "/desktop":
      option = "desktop";
      break;
    case "/mobile":
      option = "mobile";
      break;
    default:
      validCommand = false;
      bot.sendMessage(chatId, "Invalid Command");
      break;
  }
  if (validCommand) {
    bot.sendMessage(chatId, "Lighthouse is warming up...");
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
  const runnerResult = await lighthouse('https://test.sweetandhealthy.de/saftiger-karottenkuchen-ohne-zucker/', options);
  const reportHtml = runnerResult.report;
  fs.writeFileSync(filename, reportHtml);
  await chrome.kill();
};