FROM node:16-alpine

RUN adduser -D somebody
USER somebody

WORKDIR /home/somebody

RUN mkdir common server web
COPY --chown=somebody:somebody common/package.json common/package-lock.json common/
COPY --chown=somebody:somebody server/package.json server/package-lock.json server/
COPY --chown=somebody:somebody web/package.json web/package-lock.json web/

RUN cd common && npm install
RUN cd server && npm install
RUN cd web && npm install

COPY --chown=somebody:somebody common common/
COPY --chown=somebody:somebody server server/
COPY --chown=somebody:somebody web web/

RUN cd common && npm run check
RUN cd server && npm run check
RUN cd web && npm run build

ENV NODE_ENV=production PORT=8000

EXPOSE 8000
WORKDIR /home/somebody/server
CMD ["node", "dist/src/server.js"]
