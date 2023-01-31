const { db } = require('@cowellness/cw-micro-service')()
const constants = require('./queue.constants')

const notificationSchema = require('./subschema/notifications.subschema')
const Schema = db.notifications.Schema

const Queue = new Schema(
  {
    channel: {
      type: String,
      enum: constants.channels
    },
    profileId: {
      type: String
    },
    messages: {
      type: [{
        fromProfileId: String,
        fromProfileName: String,
        chatId: String,
        messageId: String,
        message: String,
        createdAt: Date
      }]
    },
    notifications: [
      notificationSchema
    ],
    archivedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)
module.exports = db.notifications.model('Queue', Queue)
