FROM node:22.23.4

ARG COMMIT_HASH
ENV COMMIT_HASH=${COMMIT_HASH}

WORKDIR /usr/src/app

COPY public/ public/
COPY .gitignore ./
COPY *.js ./
COPY README.md package.json package-lock.json ./

RUN npm install --omit=dev

EXPOSE 3001

CMD ["npm", "start"]
