import requests
from time import sleep
import os


global OFFSET
OFFSET = 0

botToken = "1898235019:AAFWytR_4QaPP_zjkSIXwcaGoKBO3zzTD4E"

global requestURL
global sendURL

requestURL = "http://api.telegram.org/bot" + botToken + "/getUpdates"
sendURL = "http://api.telegram.org/bot" + botToken + "/sendMessage"

def update (url):
    global OFFSET

    try:
        update_raw = requests.get(url + "?offset=" + str(OFFSET))
        update = update_raw.json()
        result = extract_result(update)

        if result != False:
            OFFSET = result['update_id'] + 1
            return result
        else:
            return False

    except requests.exceptions.ConnectionError:
        pass

def extract_result (dict):
    result_array = dict['result']

    if result_array == []:
        return False
    else:
        result_dic = result_array[0]
        return result_dic


def send_message (chatId, message):
    requests.post(sendURL + "?chat_id=" + str(chatId) + "&text=" + message)


while True:
    newmessage = update (requestURL)
    
    try:

        if newmessage != False:
            userchatid = newmessage['message']['chat']['id']
            usertext = newmessage['message']['text']
            username = newmessage['message']['chat']['first_name']

            if usertext.lower() == "mobile":
                os.system('lighthouse https://test.sweetandhealthy.de/saftiger-karottenkuchen-ohne-zucker/ --chrome-flags="--headless" --output-path=./outputMobile.html')
                send_message(userchatid, "lighthouse mobile")
                file="test.txt"
                bot.sendDocument(chat_id=chat_id, document=open(file, 'rb'))
                
            if usertext.lower() == "desktop":
                os.system('lighthouse https://test.sweetandhealthy.de/saftiger-karottenkuchen-ohne-zucker/ --preset=desktop --chrome-flags="--headless" --output-path=./outputDesktop.html')
                send_message(userchatid, "lighthouse desktop")
    
    except Exception:
        pass

    sleep (1)