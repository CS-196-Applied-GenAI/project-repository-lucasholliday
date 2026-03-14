import { addReply, getReplies } from './repliesStore'

describe('repliesStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds and retrieves replies for a tweet id', () => {
    addReply('1', {
      id: 'r1',
      author_username: 'lucas',
      text: 'first reply',
      created_at: '2026-03-05T12:00:00.000Z',
    })

    const replies = getReplies('1')

    expect(replies).toHaveLength(1)
    expect(replies[0].id).toBe('r1')
    expect(replies[0].text).toBe('first reply')
  })

  it('keeps replies isolated by tweet id', () => {
    addReply('1', {
      id: 'r1',
      author_username: 'lucas',
      text: 'reply for one',
      created_at: '2026-03-05T12:00:00.000Z',
    })
    addReply('2', {
      id: 'r2',
      author_username: 'anna',
      text: 'reply for two',
      created_at: '2026-03-05T12:01:00.000Z',
    })

    expect(getReplies('1').map((r) => r.id)).toEqual(['r1'])
    expect(getReplies('2').map((r) => r.id)).toEqual(['r2'])
  })
})
