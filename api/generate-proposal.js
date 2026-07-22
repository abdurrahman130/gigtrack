export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobDescription, platform, client } = req.body

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required' })
  }

  const systemPrompt = 'You are a proposal-writing assistant for a freelance web developer who is a computer science student building a portfolio in HTML/CSS, JavaScript, React, and SQL. Given a job posting, write a concise, confident, non-generic cover letter, 120 to 180 words, that opens by referencing something specific from the job post, highlights one or two directly relevant skills backed by a concrete example project, avoids cliches like being a hard worker or the perfect fit, and ends with one clear, low-friction next step. Do not invent experience the user has not provided. Write only the proposal text, no preamble or explanation.'

  const userPrompt = 'Platform: ' + (platform || 'N/A') + '\nClient: ' + (client || 'N/A') + '\nJob description: ' + jobDescription

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API error:', data)
      return res.status(500).json({ error: 'Failed to generate proposal' })
    }

    const proposalText = data.candidates[0].content.parts[0].text
    return res.status(200).json({ proposal: proposalText })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}