const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/subscriptions/get', (msg) => {
  const filter = msg.data
  return ctr.subscriptions.find(filter)
})
