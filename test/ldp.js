const test = require('tape')
const { extractId } = require('../ldp')

test('extractId()', (t) => {
  const fixtures = [
    {
      id: 'https://www.example.com/user/collection/123-456',
      containerUrl: 'https://www.example.com/user/collection',
      expected: '123-456',
    },
    {
      id: '123-456',
      containerUrl: 'https://www.example.com/user/collection',
      expected: null,
    },
    {
      id: 'https://www.example.com/user/other-collection/123-456',
      containerUrl: 'https://www.example.com/user/collection',
      expected: null,
    },
  ]
  t.plan(fixtures.length)

  for (const { id, containerUrl, expected } of fixtures) {
    t.equal(
      extractId(id, containerUrl),
      expected,
      `Annotation IDs do match (${expected})`
    )
  }
})
