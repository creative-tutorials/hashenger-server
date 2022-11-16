"use-strict";
// const generate = require('meaningful-string');
import generate from "meaningful-string";
import { LocalStorage } from "node-localstorage";
import * as dotenv from "dotenv";
import colors from "colors";
import express, { json, urlencoded } from "express";
const app = express();

import cors from "cors";
import path from "path";
dotenv.config();
app.use(json({ limit: "1000mb" }));
app.use(urlencoded({ limit: "1000mb", extended: true }));
const PORT = process.env.PORT || 6342;
const server_key = process.env.SERVER_API_KEY;
const allowedOrigins = [
  `${process.env.SERVER1}`,
  `${process.env.SERVER2}`,
  `${process.env.SERVER3}`,
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.route("/").get((req, res) => {
  const apikey = req.headers.apikey;

  if (apikey !== server_key) {
    res.status(401).send({ code: "API KEY is invalid" });
  } else {
    res.status(200).send({ code: "Welcome" });
  }
});

app.route("/connect").post(function (req, res) {
  const apikey = req.headers.apikey;
  if (apikey !== server_key) {
    res.status(401).send({ code: "API KEY is invalid" });
  } else {
    ConnectUser(req, res);
  }
});

app.route("/create").post((req, res) => {
  GenerateToken(req, res);
});
const token_database = [{token: 123}];
function GenerateToken(req, res) {
  const server_token = generate.random();
  if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = new LocalStorage("./scratch");
  }

  localStorage.setItem("token", server_token);
  if (server_token) {
    res.send({ code: "Token generated ", server_token });
    token_database[0].token = server_token;
    console.log(token_database)
  } else {
    console.log("bad");
  }
}

const ConnectUser = (req, res) => {
  if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = new LocalStorage("./scratch");
  }

  const server_token = localStorage.getItem("token");
  const session = req.body.session;
  const session_token = req.body.session.token;
  const user = req.body.session.username;
  if (session_token !== server_token) {
    res.status(401).send({ code: "Invalid token" });
  } else {
    res.status(200).send({
      code: `${
        "Connected Successfully!" + " " + user + " " + "has joined the chat"
      }`,
    });
    ChatSystem(req, res, user, session_token, server_token);
  }
};
const chat_box = [];
const ChatSystem = (req, res, user, session_token, server_token) => {
  const message = req.body.chat;
  const checkTokenExistance = token_database.find(
    (checkTokenExistance) => checkTokenExistance.token === session_token
  );
  console.log(session_token);
  console.log(checkTokenExistance);
  if(checkTokenExistance) {
    console.log('ok')
    user = checkTokenExistance.username;
    chat_box.push(req.body);
    console.log(req.body);
  } else {
    console.log('err')
  }
};

app.listen(PORT, () => {
  try {
    console.log(`Server is running on port ${PORT}`.green);
  } catch (error) {
    console.log(error);
  }
});
