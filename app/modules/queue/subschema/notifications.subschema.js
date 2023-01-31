const { db } = require('@cowellness/cw-micro-service')()
const constants = require('../queue.constants')

const Schema = db.notifications.Schema

const schema = new Schema(
  {
    type: {
      type: String,
      enum: constants.types
    },
    messageId: {
      type: Schema.Types.ObjectId
    },
    time: Date,
    inQueue: {
      type: Boolean,
      default: false
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

module.exports = schema
