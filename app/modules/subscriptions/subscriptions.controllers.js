const { db, rabbitmq, factoryConfig, log } = require('@cowellness/cw-micro-service')()
const webpush = require('web-push')

webpush.setVapidDetails(
  factoryConfig.options.mailto,
  factoryConfig.options.vapidPublicKey,
  factoryConfig.options.vapidPrivateKey
)
/**
 * @class SubscriptionsController
 * @classdesc Controller Subscriptions
 */
class SubscriptionsController {
  constructor () {
    this.Subscriptions = db.notifications.model('Subscriptions')
  }

  /**
   * Create a push subscription for a user
   * @param {*} param0 {subscription}
   */
  createSubscription ({ _user, subscription }) {
    return this.Subscriptions.create({
      profileId: _user.profileId,
      subscription
    })
  }

  /**
   * Sends a notification
   * @param {String} profileId
   * @param {Object} content {title, body}
   */
  async sendNotification (profileId, content) {
    const { title, body } = content
    const subscriptions = await this.Subscriptions.find({
      profileId
    })

    return Promise.all(
      subscriptions.map(item => {
        return webpush
          .sendNotification(item.subscription, JSON.stringify({
            title,
            body,
            profileId
          }))
      })
    ).catch(err => log.error(err))
  }

  /**
   * Send a notification using a template
   * @param {String} templateId the template id
   * @param {String} profileId profile id to send the notification to
   * @param {Object} data variables to send to template
   */
  async sendNotificationWithTemplate (templateId, profileId, data) {
    log.info('fetching template')
    let body = data.message

    if (body) {
      body = body.substr(0, 90)
    } else {
      const { data: template } = await rabbitmq.sendAndRead('/settings/messages/get', {
        key: templateId,
        type: 'notification',
        data
      })
      body = template
    }
    log.info('sending push...')
    log.info(body)
    return this.sendNotification(profileId, {
      title: data.fromProfileName || 'You received a new message',
      body
    })
  }
}

module.exports = SubscriptionsController
