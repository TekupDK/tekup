FROM node:20-bullseye

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --include=optional && npm install --save-dev @rollup/rollup-linux-x64-gnu@4.50.2

COPY . .

EXPOSE 5173

CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]
