#!/usr/bin/python
import sys
import time
import telepot
from telepot.loop import MessageLoop
import pdb
import os
from datetime import date

today = date.today()
d4 = today.strftime("%Y-%m-%d")

def handle(msg):
    content_type, chat_type, chat_id = telepot.glance(msg)
    print(content_type, chat_type, chat_id)

    if content_type == 'text' and msg["text"].lower() == "/mobile":     
        bot.sendMessage(chat_id, "Lighthouse is warming up...")

        os.system('lighthouse https://test.sweetandhealthy.de/saftiger-karottenkuchen-ohne-zucker/ --chrome-flags="--headless" --output-path=./outputMobile.html')
        file="outputMobile.html"
        bot.sendDocument(chat_id=chat_id, document=open(file, 'rb'))
        os.remove("outputMobile.html")


    if content_type == 'text' and msg["text"].lower() == "/desktop":     
        bot.sendMessage(chat_id, "Lighthouse is warming up...")

        os.system('lighthouse https://test.sweetandhealthy.de/saftiger-karottenkuchen-ohne-zucker/ --preset=desktop --chrome-flags="--headless" --output-path=./outputDesktop.html')
        file="outputDesktop.html"
        bot.sendDocument(chat_id=chat_id, document=open(file, 'rb'))
        os.remove("outputDesktop.html")

# replace XXXX.. with your token
TOKEN = '1898235019:AAFWytR_4QaPP_zjkSIXwcaGoKBO3zzTD4E'
bot = telepot.Bot(TOKEN)
MessageLoop(bot, handle).run_as_thread()
print ('Listening ...')
# Keep the program running.
while 1:
    time.sleep(10)