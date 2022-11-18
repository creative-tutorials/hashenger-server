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

const user_ = [];
const regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
app.route("/register").post(function (req, res) {
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.email === req.body.email &&
      identifyUserExistance.password === req.body.password
  );
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;
  if (identifyUserExistance) {
    res.status(401).send({ code: "You already have an account with us" });
  } else {
    MoveToStep2();
  }
  function MoveToStep2() {
    if (username === "" || email === "" || password === "") {
      res.status(401).send({
        code: "You must fill the fields before moving unto the next step",
      });
    } else {
      ValidateEmailField(req, res, email, password);
    }
  }
});
function ValidateEmailField(req, res, email, password) {
  if (regex.test(email) && email.includes(".")) {
    ValidatePasswordField(req, res, password);
  } else {
    res.status(401).send({ code: "email not valid" });
  }
}
function ValidatePasswordField(req, res, password) {
  if (password.length > 8) {
    req.body.token = null;
    res.status(200).send({ code: "Account created Sucessfully" });
    user_.push(req.body);
  } else {
    res
      .status(401)
      .send({ code: "Your password must be at least 10 characters" });
  }
}

app.route("/admin").get(function (req, res) {
  const apikey = req.headers.apikey;

  if (apikey !== server_key) {
    res.status(401).send({ code: "Unauthorized to view this route" });
  } else {
    CheckIfArrayIsEmpty();
  }
  function CheckIfArrayIsEmpty() {
    if (user_ && user_.length) {
      res.status(200).send(user_);
    } else {
      res.status(404).send({ code: "No user was found in the database" });
    }
  }
});

app.route("/login").post((req, res) => {
  const email_input = req.body.email;
  const password_input = req.body.password;
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.email === req.body.email &&
      identifyUserExistance.password === req.body.password
  );
  if (email_input === "" || password_input === "") {
    res.status(401).send({ code: "Field cannot be empty" });
  } else {
    CheckEmailFieldForValidInput();
  }
  function CheckEmailFieldForValidInput() {
    if (regex.test(email_input) && email_input.includes(".")) {
      CheckIfUserIsAuth();
    } else {
      res.status(401).send({ code: "email not valid" });
    }
  }
  function CheckIfUserIsAuth() {
    if (identifyUserExistance) {
      res.status(200).send({ code: "Login Sucessfully" });
    } else {
      res.status(401).send({ code: "That account does'nt exist" });
    }
  }
});

app.route("/create").post((req, res) => {
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.email === req.body.email &&
      identifyUserExistance.password === req.body.password
  );
  if (identifyUserExistance) {
    GenerateToken(req, res, identifyUserExistance);
  } else {
    res
      .status(401)
      .send({ code: "You must have an account to continue this process" });
  }
});
const token_database = [{ token: null }];
function GenerateToken(req, res, identifyUserExistance) {
  const server_token = generate.random();
  if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = new LocalStorage("./scratch");
  }

  localStorage.setItem("token", server_token);
  if (server_token) {
    res.send({ code: "Token generated ", server_token });
    identifyUserExistance.token = server_token;
    token_database[0].token = server_token;
  } else {
    console.log("bad");
  }
}

app.route("/connect").post(function (req, res) {
  const apikey = req.headers.apikey;
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.email === req.body.email &&
      identifyUserExistance.password === req.body.password
  );
  if (apikey !== server_key) {
    res.status(401).send({ code: "API KEY is invalid" });
  } else {
    CheckIfUserIsAuthorized();
  }
  function CheckIfUserIsAuthorized() {
    if (identifyUserExistance) {
      ConnectUser(req, res, identifyUserExistance);
    } else {
      res
        .status(401)
        .send({ code: "You must have an account to continue this process" });
    }
  }
});

const ConnectUser = (req, res, identifyUserExistance) => {
  if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = new LocalStorage("./scratch");
  }

  const server_token = identifyUserExistance.token;
  const session = req.body.session;
  const session_token = req.body.session.token;
  const user = req.body.session.username;
  if (session_token !== server_token) {
    res.status(401).send({ code: "Invalid token" });
  } else {
    ChatSystem(req, res, user, session_token, server_token);
  }
};
const chat_box = [];
const ChatSystem = (req, res, user, session_token, server_token) => {
  const message = req.body.chat;
  const identifyUserName = user_.find(
    (identifyUserName) =>
    identifyUserName.username === req.body.session.username
  );
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.token === req.body.session.token
  );
  if (identifyUserExistance) {
    CheckIfUserNameIsADuplicate();
  } else {
    res.status(403).send({
      code: `${"Token is not authorized, or has expired"}`,
    });
  }
  function CheckIfUserNameIsADuplicate() {
    if(identifyUserName) {
      MoveToNextStep();
    } else {
      res.status(403).send({
        code: `${"Username is not registered to an account"}`,
      });
    }
  }

  function MoveToNextStep() {
    res.status(200).send({
      code: `${
        "Connected Successfully!" + " " + user + " " + "has joined the chat"
      }`,
    });
    console.log("ok");
    user = identifyUserExistance.username;
    chat_box.push(req.body);
  }
};

app.route("/chatio").get((req, res) => {
  const apikey = req.headers.apikey;
  if (apikey !== server_key) {
    res.status(401).send({ code: "API KEY is invalid" });
  } else {
    ViewChatMessage(req, res);
  }
});

function ViewChatMessage(req, res) {
  if (chat_box && chat_box.length) {
    res.status(200).send(chat_box);
  } else {
    res.status(404).send({ code: "No chat was found in your chat database" });
  }
}

app.listen(PORT, () => {
  try {
    console.log(`Server is running on port ${PORT}`.green);
  } catch (error) {
    console.log(error);
  }
});
