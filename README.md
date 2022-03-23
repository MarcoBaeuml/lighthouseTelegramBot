# Lighthouse Telegram Bot

<p>Generate Lighthouse reports with Telegram bot</p>
<img src="https://raw.githubusercontent.com/MarcoBaeuml/lighthouseTelegramBot/master/lighthouseTelegramBot_example.png" alt="lighthouseTelegramBot_example.png" width=60% />

## Docker

### Docker run

```
docker run -d -e BOT_TOKEN=<BOT_TOKEN> -v $HOME/lighthouseTelegramBot:/app/data --restart always marcobaeuml/lighthousetelegrambot
```

### Docker compose

```
version: '3'
services:
    lighthousetelegrambot:
        image: marcobaeuml/lighthousetelegrambot
        container_name: lighthousetelegrambot
        environment:
            - BOT_TOKEN=<BOT_TOKEN>
        volumes:
            - '$HOME/lighthouseTelegramBot:/app/data'
        restart: always
```

### Block user

#### If you want to block unwanted users, you can add a whitelist
Create whitelist.json in $HOME/lighthouseTelegramBot/data and add the chat IDs you want to grant access to<br>
```
echo '{ "chatId": [<chatI>, <chatId>] }' > $HOME/lighthouseTelegramBot/whitelist.json
```
<p>If no whitelist file is provided, any user will be accepted</p>

## Help

### Create Telegram bot

https://core.telegram.org/bots

### Get chat ID

When you send a message to the bot, a log file is created where you can find your chat ID
