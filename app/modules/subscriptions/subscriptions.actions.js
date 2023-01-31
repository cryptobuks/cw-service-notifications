const { ctr } = require('@cowellness/cw-micro-service')()

/**
 * @class SubscriptionsActions
 * @classdesc Actions Subscriptions
 */
class SubscriptionsActions {
  async createSubscription (data, reply) {
    const subscription = await ctr.subscriptions.createSubscription(data)

    return reply.cwSendSuccess({
      data: {
        subscription
      }
    })
  }
}

module.exports = SubscriptionsActions
