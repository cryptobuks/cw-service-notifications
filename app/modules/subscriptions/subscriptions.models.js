const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.notifications.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: String
    },
    subscription: {
      type: Object
    }
  },
  { timestamps: true }
)

module.exports = db.notifications.model('Subscriptions', newSchema)
