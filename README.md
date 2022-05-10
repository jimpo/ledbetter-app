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

Next, run the web server development and test databases in a container.

```bash
$ cd server
$ docker-compose up
```

Create the development database

```bash
$ docker-compose exec mysql mysql --user root --password
Enter password: # The password is topsecret
mysql> CREATE DATABASE ledbetter;
Query OK, 1 row affected (0.04 sec)
mysql> GRANT ALL PRIVILEGES ON ledbetter.* TO admin;
Query OK, 0 rows affected (0.04 sec)
```

Install all dependencies.

```bash
$ npm install
```

Run migrations on the test and development databases.

```bash
$ npm run migrate
$ npm run migrate_test
```

Finally, run the web server

```bash
$ npm start
```

Visit the running application at [localhost:3000](http://localhost:3000).
