import { buildAISuggestionPrompt } from '@/lib/ai-suggestion-service'

describe('buildAISuggestionPrompt', () => {
  it('includes liked, disliked, and rejected AI sections', () => {
    const prompt = buildAISuggestionPrompt({
      category: 'sofa',
      userId: 'user1',
      count: 3,
      liked: [
        { title: 'KIVIK', retailer: 'IKEA', price: '499 €', description: 'Modular fabric sofa' },
      ],
      disliked: [
        { title: 'Low Back Chair', retailer: 'Generic', price: '99 €', description: 'Too low and flimsy' },
      ],
      rejectedAISuggestions: [
        { title: 'Ultra-Modern Sofa', retailer: 'HighEnd', reasoning: 'Sleek but may not match your cozy style', confidence: 0.72 },
      ],
    })

    expect(prompt).toMatch(/Your past matches \(liked\)/)
    expect(prompt).toMatch(/No matches \(disliked real items\)/)
    expect(prompt).toMatch(/No matches \(discarded AI suggestions\)/)
    expect(prompt).toMatch(/KIVIK/)
    expect(prompt).toMatch(/Low Back Chair/)
    expect(prompt).toMatch(/Ultra-Modern Sofa/)
  })
})


