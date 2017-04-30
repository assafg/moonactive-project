const KEY_PATTERN = /^scheduler__(.*)/;
const SCHEDULER_PREFIX = 'scheduler__';
const JOB_INFO_KEY = 'job_info';

const handleMessage = (data) => {
  const { message } = data;
  console.log('MESSAGE:', message);
}

const scheduleInRedis = redisClient => data => {
  redisClient.set(`${SCHEDULER_PREFIX}${data.id}`, '', 'PX', data.timeUTC - Date.now(), (err) => {
    if (err) {
      console.log('Error', err);
    }
    redisClient.hset(JOB_INFO_KEY, data.id, JSON.stringify(data))
  });
}

const onExpEvent = client => key => {
  const match = key.match(KEY_PATTERN);
  if (!match) {
    return;
  }

  client.hget(JOB_INFO_KEY, match[1], (err, data) => {
    if (err) {
      console.log('Error', err);
      return;
    }
    if (data) {
      client.hdel(JOB_INFO_KEY, match[1], (err, resp) => {
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

  // Check for expired task
  client.hkeys(JOB_INFO_KEY, (err, keys) => {
    keys.forEach(key => _onExpEvent(`${SCHEDULER_PREFIX}${key}`));
  })
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
