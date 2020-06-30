# Simple Annotation Server

This is a very simple annotation server for intended testing purposes, implementing both the [Web Annotation Protocol](https://www.w3.org/TR/annotation-protocol/) as well as the [Web Annotation Data Model](https://www.w3.org/TR/annotation-model/). The server is written in JavaScript and runs in [Node.js](https://nodejs.org/en/), running an in-process LevelDB database.

The server is in active development and its API is subject to frequent change.


### Usage

With a recent version of Node.js installed (`v12` should be sufficient), install all dependencies via `npm install`. Then, start the annotation server via `node index.js`—3000 will be its default port. With each start, the annotation server will generate a new, random API token which will be reported in its terminal output during startup.

#### Creating Users

We'll be using `curl` to access the annotation server's JSON API. To create new user, run the following command, specifying the API token either via GET parameters (`access_token`) or via HTTP bearer authentication:

```bash
curl -XPOST http://localhost:3000/users/alice?access_token=${API_TOKEN}
```

In its HTTP response, the server will return a new, random password for that user.

#### Creating Collections

With the newly created user and the assigned password, we'll create a new annotation collection. A collection corresponds to a [Web Annotation Container](https://www.w3.org/TR/annotation-protocol/#annotation-containers), which is a collection of annotations. Each user can have multiple collections.

To create such a collection named ‘Notes’ for Alice, run the following command:

```bash
curl -XPOST --user alice:${PASSWORD} http://localhost:3000/alice/notes
```

More TBD.


### API Documentation

TBD.


### License

MIT
