const { db, _, rabbitmq, ctr, email: emailHelper, sms: smsHelper, log, domain } = require('@cowellness/cw-micro-service')()
const constants = require('./queue.constants')
/**
 * @class QueueController
 * @classdesc Controller Queue
 */
class QueueController {
  constructor () {
    this.Queue = db.notifications.model('Queue')
  }

  /**
   * Creates / Appends new message to db
   */
  async newMessage (data) {
    const { channel, toProfileId, fromProfileId, fromProfileName, message, messageId, chatId, createdAt } = data
    const queue = await this.Queue.findOne({
      channel,
      profileId: toProfileId,
      archivedAt: null
    })

    if (!queue) {
      log.info('creating new queue')
      return this.createMessage(data)
    }
    log.info('appending message')
    const messageExists = queue.messages.find(message => message.fromProfileId === fromProfileId)

    if (!messageExists) {
      const newMessage = queue.messages.create({
        fromProfileId,
        fromProfileName,
        messageId,
        chatId,
        message,
        createdAt
      })
      queue.messages.push(newMessage)

      queue.notifications.push({
        time: Date.now() + (15 * 1000),
        type: 'push',
        messageId: newMessage._id
      })
    }
    log.info('queue saved')
    return queue.save()
  }

  async createMessage ({ channel, toProfileId, fromProfileId, fromProfileName, message, messageId, chatId, createdAt }) {
    log.info('creating queue....')
    const queue = await this.Queue.create({
      channel,
      profileId: toProfileId,
      messages: [{
        fromProfileId,
        fromProfileName,
        message,
        messageId,
        chatId,
        createdAt
      }],
      notifications: []
    })
    const notifications = constants.notifications[channel].map(notification => ({
      ...notification,
      time: Date.now() + notification.time,
      messageId: _.first(queue.messages)._id
    }))
    queue.notifications.push(...notifications)
    return queue.save()
  }

  /**
   * Checks any upcoming notificaitons to send
   */
  async check () {
    log.info('checking notifications')
    const list = await this.Queue.find({
      notifications: {
        $elemMatch: {
          time: {
            $lte: Date.now()
          },
          isDelivered: false,
          inQueue: false
        }
      },
      archivedAt: null
    })
    log.info(`${list.length} queues ready to parse`)
    if (!list.length) {
      return
    }
    await Promise.all(list.map(item => {
      item.notifications = item.notifications.map(notif => {
        if (notif.time <= Date.now() && !notif.inQueue && !notif.isDelivered) {
          notif.inQueue = true
        }
        return notif
      })
      return item.save()
    }))
    log.info('sending inQueue for parsing')
    // send for parsing
    list.forEach(item => {
      rabbitmq.send('/notifications/parse', {
        _id: item._id
      })
    })
  }

  /**
   * Get the queue and send notifications
   */
  async parseQueue (queueId) {
    log.info('Parsing queue', queueId)
    const queue = await this.Queue.findOne({
      _id: queueId
    })
    const notificationsInQueue = queue.notifications.filter(notif => notif.inQueue)

    if (!notificationsInQueue.length) {
      log.info(`no notifications to send, for queue: ${queueId}`)
      return
    }
    log.info(`${notificationsInQueue.length} notifications ready to send`)
    const { data: profiles } = await rabbitmq.sendAndRead('/auth/profile/get', {
      _id: queue.profileId
    })
    log.info(profiles)
    const profile = _.first(profiles)
    log.info(`profile found : ${profile._id}`)
    const emails = profile.person.emails
    const mobilePhones = profile.person.mobilePhones
    const usableEmail = emails.find(email => email.isForNotifications)
    const usablePhone = mobilePhones.find(phone => phone.isForNotifications)
    const email = _.get(usableEmail, 'email', null)
    const phone = _.get(usablePhone, 'prefixNumber') + _.get(usablePhone, 'phoneNumber')
    log.info(`email: ${email}`)
    log.info(`phone: ${phone}`)
    queue.notifications.forEach((item, index) => {
      log.info(`item inQueue: ${item._id} - ${item.inQueue}`)
      if (!item.inQueue) {
        return
      }
      log.info('item inQueue')
      const message = queue.messages.find(message => message._id.toString() === item.messageId.toString())
      const params = {
        toProfileId: profile._id,
        name: profile.displayName || '',
        fromProfileName: message.fromProfileName,
        link: `https://${domain}/chat/?idMessage=${message.messageId}&cId=${message.chatId}`,
        message: message.message
      }
      const templateId = `notifications.${queue.channel}.${item.type}`
      log.info(`templateId: ${templateId} - ${item.type}`)
      log.info(params)
      if (item.type === 'push') {
        ctr.subscriptions.sendNotificationWithTemplate(templateId, profile._id, params)
      } else
      if (item.type === 'email') {
        if (email) {
          emailHelper.sendEmail([email], undefined, templateId, profile.settings.language, params)
        }
      } else
      if (item.type === 'sms') {
        if (phone) {
          smsHelper.sendWithTemplate(templateId, profile.settings.language, [phone], params)
        }
      }
      log.info(`sending notification as ${item.type}`)
      queue.notifications[index].inQueue = false
      queue.notifications[index].isDelivered = true
      queue.notifications[index].deliveredAt = Date.now()
    })
    await queue.save()
  }

  /**
   * Archives a message
   */
  async archiveMessages ({ channel, profileId }) {
    const queue = await this.Queue.findOne({
      channel,
      profileId,
      archivedAt: null
    })
    if (!queue) {
      return null
    }
    queue.archivedAt = Date.now()
    log.info(`archived queue for profile ${profileId} on channel ${channel} at ${queue.archivedAt}`)
    return queue.save()
  }
}

module.exports = QueueController
