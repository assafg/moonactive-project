const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
});
const listener = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
});
const { schedule } = require('./functions')(client, listener);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// API
app.post('/echoAtTime', (req, res) => {
  const {
    message,
    timeUTC
  } = req.body;
  const now = Date.now();
  schedule({
    id: uuid.v4(),
    message,
    timeUTC
  });
  res.sendStatus(200).send();
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on port ' + server.address().port);
});
