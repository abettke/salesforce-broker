FROM node:9.0.0-slim
RUN apt-get update

WORKDIR /usr/app

COPY package.json .

RUN npm install --quiet

RUN rm package.json
