export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobDescription, platform, client } = req.body

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' })
  }

  const systemPrompt = `You are a proposal-writing assistant for a freelance web developer who is a computer science student building a portfolio in HTML/CSS, JavaScript, React, and SQL. Given a job posting, write a concise, confident, non-generic cover letter (120-180 words) that:
- Opens by referencing something specific from the job post (not a template greeting)
- Highlights 1-2 directly relevant skills, backed by a concrete example project
- Avoids clichés like "I am a hard worker" or "I am the perfect fit"
- Ends with one clear, low-friction next step
Do not invent experience the user hasn't provided. Write only the proposal text, no preamble or explanation.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Platform: ${platform || 'N/A'}\nClient: ${client || 'N/A'}\nJob description: ${jobDescription}`,
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', data)
      return res.status(500).json({ error: 'Failed to generate proposal' })
    }

    const proposalText = data.content[0].text
    return res.status(200).json({ proposal: proposalText })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}