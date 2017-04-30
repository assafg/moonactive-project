const KEY_PATTERN = /^scheduler__(.*)/;

const handleMessage = (data) => {
  const { message } = data;
  console.log('MESSAGE:', message);
}

const scheduleInRedis = redisClient => data => {
  redisClient.set(`scheduler__${data.id}`, '', 'PX', data.timeUTC - Date.now(), (err) => {
    if (err) {
      console.log('Error', err);
    }
    redisClient.set(`job_info__${data.id}`, JSON.stringify(data))
  });
}

const onExpEvent = client => key => {
  const match = key.match(KEY_PATTERN);
  if (!match) {
    return;
  }

  client.get(`job_info__${match[1]}`, (err, data) => {
    if (err) {
      console.log('Error', err);
      return;
    }
    if (data) {
      client.del(`job_info__${match[1]}`, (err, resp) => {
        if (err) {
          console.log('Error', err);
          return;
        }
        // To Make sure only one process actually processes the task
        // Only the process that manages to delete the data record "wins"
        if (resp) {
          handleMessage(JSON.parse(data));
        }
      });
    }
  });
}

module.exports = (client, listener) => {
  // Init
  const _scheduleInRedis = scheduleInRedis(client);
  const _onExpEvent = onExpEvent(client);

  listener.on('message', (channel, message) => {
    _onExpEvent(message);
  });

  listener.subscribe('__keyevent@0__:expired');
  // Init end

  return {
    schedule: (data) => {
      if (data.timeUTC <= Date.now()) {
        handleMessage(data);
      } else {
        _scheduleInRedis(data);
      }
    }
  }
}
