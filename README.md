# Simple scheduler

This project uses [Redis Keyspace Notifications](https://redis.io/topics/notifications) and requires:
1. Redis 2.8 and up
2. Enable keyspace notifications (disabled by default) - in the redis.config set: _notify-keyspace-events "E"_

## Redis Location
Unless stated otherwise this app assumes redis is at 127.0.0.1:6379

You can set a different location by setting the following environment variables:

* REDIS_HOST
* REDIS_PORT

Redis authorization is currently not supported

## Port
This app listens by default to port 3000 and will crash if it is taken. To use a different port set the *PORT* environment variable.

Cluster is not implemented internally - use a LB (i.e. Nginx) and run several instances on different ports - then set the upstream locations in the LB.

## Schedule request:

A schedule request should be a **POST** request to /echoAtTime with the following JSON as the request's body:

```JSON
{
	"message": "[message to print to console]",
	"timeUTC": [TIMESTAMP (UTC) to print the message (Number)]
}
```

## Installation
1. clone this repo
2. cd into the project directory
3. npm install
4. Make sure redis is running and available (set env vars if needed)
4. npm start / npm dev
