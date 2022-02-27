FROM node:17-alpine3.14

WORKDIR /app

RUN apk update

RUN apk add chromium 

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json .

RUN yarn

COPY . .

CMD yarn start
