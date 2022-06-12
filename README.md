# LEDBetter Lights Web App

See [here](https://github.com/jimpo/ledbetter) for project information.

## Running with Docker Compose

Have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

In the base directory run

```bash
$ docker-compose build
$ docker-compose up
$ docker-compose exec npm run migrate
```

Visit the running application at [localhost:8000](http://localhost:8000).

## Development

Have [NodeJS](https://nodejs.dev/) installed.

In one terminal window, run

```bash
$ cd web
$ npm install
$ npm run dev
```

This will live-update the web frontend anytime the frontend code in `web/` changes.

Next, change to the web server directory.

```bash
$ cd server
```

Install all dependencies.

```bash
$ npm install
```

Run tests.

```bash
$ npm run check
$ npm test
```

Run migrations on the development database.

```bash
$ npm run migrate
```

Finally, run the web server

```bash
$ npm start
```

Visit the running application at [localhost:3000](http://localhost:3000).
