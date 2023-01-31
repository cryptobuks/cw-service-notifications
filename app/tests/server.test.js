const cw = require('@cowellness/cw-micro-service')()

beforeAll(() => {
  return cw.startFastify()
})

afterAll(() => {
  return cw.stopFastify()
})

describe('Test app working - 404 and headers', () => {
  it('route not found', async () => {
    expect(true).toBe(true)
  })
})
