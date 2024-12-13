### Before this: Build ts to js, run command  [npx tsc] ###
FROM node:14.18.0 AS build
WORKDIR /code
COPY package.json ./
RUN npm install
COPY dist .
EXPOSE 3000
CMD ["node", "./gateway.js"]

