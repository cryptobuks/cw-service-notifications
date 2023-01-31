const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

/**
 * Creates / Appends new message to db
 */
rabbitmq.consume('/notifications/new-message', (msg) => {
  const filter = msg.data
  return ctr.queue.newMessage(filter)
})
// queue usage
// rabbitmq.send('/notifications/new-message', {
//   channel: 'chat',
//   toProfileId: '5fe1ee45fdcf1d6db1f455a5',
//   fromProfileId: '5fe1f11efdcf1d6db1f455a9',
//   fromProfileName: 'Faraz',
//   messageId: '123',
//   chatId: '321',
//   message: 'text message',
//   createdAt: Date.now()
// })
/**
 * Check db for upcoming notifications to send
 */
rabbitmq.consume('/notifications/check', () => {
  return ctr.queue.check()
})

/**
 * Process queue
 */
rabbitmq.consume('/notifications/parse', ({ data }) => {
  return ctr.queue.parseQueue(data._id)
})
// parse usage
// rabbitmq.send('/notifications/parse', {
//   queueId: <queue id>
// })

/**
 * Archive docs
 */
rabbitmq.consume('/notifications/archive', ({ data }) => {
  return ctr.queue.archiveMessages(data)
})
// rabbitmq.send('/notifications/archive', {
//   channel: 'chat',
//   profileId: <profile id>
// })

/**
 * schedule check upcoming notifications
 */
rabbitmq.send('/cron/append', {
  name: 'notifications:check',
  type: 'cron',
  update: true,
  crontab: '*/10 * * * * *',
  commands: [{
    type: 'rabbitmq',
    queue: '/notifications/check',
    msg: 'queue'
  }]
})
