# Anki App

This project is a simple example of an Anki-style application for the web and mobile (via Capacitor).

## Backend

The `server` folder contains an API written with Express and MongoDB. It provides user registration and login through JWT, deck and card creation, CSV import/export, and a list of public decks.

To start the server:

```bash
cd server
npm install
node index.js
```

The server runs on `http://localhost:3001`.

## Frontend

The `client` folder offers a very basic interface in HTML and React (via CDN). To try it out, simply open `client/index.html` in a browser that can reach the backend server.

This interface lets you authenticate, create decks, and list them. It serves as a starting point for integrating with Capacitor and adding more features.
