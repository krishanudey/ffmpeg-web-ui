FROM  node:16-buster 

# RUN apt-get update -yq \
#    && apt-get install curl gnupg -yq \
#    && curl -sL https://deb.nodesource.com/setup_16.x | bash \
#    && apt-get install nodejs -yq \
#    && apt-get clean -y

RUN apt-get update -yq \
    && apt-get install -y ffmpeg

WORKDIR /usr/src/app

EXPOSE 3000

COPY package*.json ./

RUN npm install glob rimraf

RUN npm install

COPY . .

CMD ["npm", "start"]