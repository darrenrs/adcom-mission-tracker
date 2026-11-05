FROM node:22.23.4 AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts ./
COPY client/ client/
RUN npx vite build

FROM node:22.23.4

ARG COMMIT_HASH
ENV COMMIT_HASH=${COMMIT_HASH}

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY .gitignore README.md ./
COPY *.js ./
COPY server/ server/
COPY --from=build /usr/src/app/dist/ dist/

EXPOSE 3001

CMD ["npm", "start"]
