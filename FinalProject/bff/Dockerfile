FROM ubuntu:latest
LABEL authors="michaelsweeney"

ENTRYPOINT ["top", "-b"]

# bff/Dockerfile
FROM node:20
WORKDIR /app
COPY ../package.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]
