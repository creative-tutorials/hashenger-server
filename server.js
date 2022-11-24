"use-strict";
import cors from "cors";
import { getCurrentDateFunc } from "./date.mjs";
import generate from "meaningful-string";
import * as dotenv from "dotenv";
import colors from "colors";
import express, { json, urlencoded } from "express";
const app = express();

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
const dateSystem = {date: null}
getCurrentDateFunc(dateSystem);
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
    GenerateID(req, res);
  } else {
    res
      .status(401)
      .send({ code: "You must have an account to continue this process" });
  }
});
const chat = [];
function GenerateID(req, res) {
  let { chatid, chatname } = req.body;
  if (chatname === "" || !chatname) {
    res.status(401).send({ code: "You must provide a name for your chat" });
  } else {
    const options = {
      min: 8,
      max: 10,
      capsWithNumbers: true,
    };
    const generatedID = generate.random(options);
    chatid = generatedID;
    console.log(chatid, chatname);
    chat.push({
      chatid: chatid,
      chatname: chatname,
      body: [],
    });
    res.send({ code: "Your chat id", generatedID });
  }
}

app.route("/connect/:id").post(function (req, res) {
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
      ConnectUser(req, res);
    } else {
      res
        .status(401)
        .send({ code: "You must have an account to continue this process" });
    }
  }
});

const ConnectUser = (req, res) => {
  const inputID = req.params;
  console.log(inputID);
  const result = chat.find((result) => result.chatid === req.params.id);
  if (!result) {
    res.status(404).send({ code: "The ID of the chat does not exist" });
  } else {
    const meetindId = chat;
    res.status(200).send(result);
    console.log(result);
  }
};

app.route("/chatio/:id").post((req, res) => {
  const apikey = req.headers.apikey;
  if (apikey !== server_key) {
    res.status(401).send({ code: "API KEY is invalid" });
  } else {
    CheckUserIsAuth(req, res);
  }
});
function CheckUserIsAuth(req, res) {
  const identifyUserExistance = user_.find(
    (identifyUserExistance) =>
      identifyUserExistance.email === req.body.email &&
      identifyUserExistance.password === req.body.password
  );
  if (identifyUserExistance) {
    SendMessage(req, res, identifyUserExistance);
  } else {
    res
      .status(401)
      .send({ code: "You must have an account to continue this process" });
  }
}
function SendMessage(req, res, identifyUserExistance) {
  const user = req.body.username;
  const inputID = req.params;
  const result = chat.find((result) => result.chatid === req.params.id);
  if (!result) {
    res.status(404).send({ code: "The ID of the chat does not exist" });
  } else {
    const meetindId = result.body;
    req.body.chatbody.username = identifyUserExistance.username;
    req.body.chatbody.timestamp = dateSystem.date;
    meetindId.push(req.body.chatbody);
    res.status(200).send({ code: "Message delivered" });
    console.log(meetindId);
  }
}

app.listen(PORT, () => {
  try {
    console.log(`Server is running on port ${PORT}`.green);
  } catch (error) {
    console.log(error);
  }
});
