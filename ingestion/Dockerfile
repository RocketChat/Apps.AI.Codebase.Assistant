FROM node:20

WORKDIR /app

COPY package.json /app

RUN npm install

ENV IN_DOCKER=true
ENV PORT=3000

COPY . /app

EXPOSE 3000

CMD ["npm", "run", "dev"]
