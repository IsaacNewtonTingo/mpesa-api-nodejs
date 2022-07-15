const express = require("express");
const app = express();

const request = require("request");
const datetime = require("node-datetime");

var bodyParser = require("body-parser");
app.use(bodyParser.json());

require("dotenv").config();

const cors = require("cors");
app.use(cors());

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;

let port = process.env.PORT;

app.listen(port, (err, live) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server running on port ${port}`);
});

//routes
app.get("/", (req, res) => {
  res.send("Hello world");
});

function access(req, res, next) {
  let url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  let auth = new Buffer.from(consumerKey + ":" + consumerSecret).toString(
    "base64"
  );
  request(
    {
      url: url,
      headers: {
        Authorization: "Basic " + auth,
      },
    },
    (error, response, body) => {
      if (error) {
        console.log(error);
      } else {
        req.access_token = JSON.parse(body).access_token;
        next();
      }
    }
  );
}

app.get("/access_token", access, (req, res) => {
  res.status(200).json({ access_token: req.access_token });
});

app.get("/make-payment", access, (req, res) => {
  let auth = "Bearer " + req.access_token;
  let datenow = datetime.create();
  const timestamp = datenow.format("YmdHMS");

  const password = new Buffer.from(
    "174379" +
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
      timestamp
  ).toString("base64");
  request(
    {
      url: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      method: "POST",
      headers: {
        Authorization: auth,
      },
      json: {
        BusinessShortCode: 174379,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: 1,
        PartyA: 254724753175,
        PartyB: 174379,
        PhoneNumber: 254724753175,
        CallBackURL: "https://fca4-105-163-0-152.eu.ngrok.io/response",
        AccountReference: "CompanyXLTD",
        TransactionDesc: "Payment of X",
      },
    },
    function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.status(200).json(body);
      }
    }
  );
});

app.post("/response", (req, res) => {
  console.log(req.body.Body.stkCallback.CallbackMetadata);
});
