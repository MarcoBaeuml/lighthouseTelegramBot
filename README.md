# Lighthouse Telegram Bot

<p>Generate Lighthouse reports with Telegram bot</p>
<img src="https://raw.githubusercontent.com/MarcoBaeuml/lighthouseTelegramBot/master/lighthouseTelegramBot_example.png" alt="lighthouseTelegramBot_example.png" width=60% />

## Run with Docker

<code>docker run -d -e BOT_TOKEN=&lt;BOT_TOKEN&gt; -v $HOME/lighthouseTelegramBot:/app/data --restart always marcobaeuml/lighthousetelegrambot</code>

### Block user

#### If you want to block unwanted users, you can add a whitelist
Create whitelist.json in $HOME/lighthouseTelegramBot/data and add the chat IDs you want to grant access to<br>
<code>echo '{ "chatId": [&lt;chatId&gt;, &lt;chatId&gt;] }' > $HOME/lighthouseTelegramBot/whitelist.json</code>
<br>
<p>If no whitelist file is provided, any user will be accepted</p>

## Help

### Create Telegram bot

https://core.telegram.org/bots

### Get chat ID

When you send a message to the bot, a log file is created where you can find your chat ID
