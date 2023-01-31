module.exports = {
  types: ['push', 'email', 'sms'],
  channels: ['chat', 'welcome'],
  notifications: {
    chat: [{
      time: (5 * 1000),
      type: 'push'
    }, {
      time: (60 * 1000),
      type: 'email'
    }, {
      time: (24 * 60 * 60 * 1000),
      type: 'push'
    }, {
      time: (24 * 60 * 60 * 1000),
      type: 'email'
    }, {
      time: (7 * 24 * 60 * 60 * 1000),
      type: 'push'
    }, {
      time: (7 * 24 * 60 * 60 * 1000),
      type: 'email'
    }, {
      time: (30 * 24 * 60 * 60 * 1000),
      type: 'push'
    }, {
      time: (30 * 24 * 60 * 60 * 1000),
      type: 'email'
    }, {
      time: (60 * 24 * 60 * 60 * 1000),
      type: 'push'
    }, {
      time: (60 * 24 * 60 * 60 * 1000),
      type: 'email'
    }]
  }
}
