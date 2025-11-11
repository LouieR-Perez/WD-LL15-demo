// Get references to the four buttons and the response area
const iceBtn = document.getElementById('iceBtn');
const factBtn = document.getElementById('factBtn');
const jokeBtn = document.getElementById('jokeBtn');
const weatherBtn = document.getElementById('weatherBtn');
const responseDiv = document.getElementById('response');

// Get references to the context and persona dropdowns
const contextSelect = document.getElementById('contextSelect');
const personaSelect = document.getElementById('personaSelect');

// Function to get the system message based on context and persona
function getSystemMessage() {
	const context = contextSelect ? contextSelect.value : 'team';
	const persona = personaSelect ? personaSelect.value : 'friendly';
	let contextText = '';
	if (context === 'team') {
		contextText = 'for a team meeting. Keep responses suitable for work and encourage team bonding.';
	} else if (context === 'classroom') {
		contextText = 'for a classroom. Keep responses age-appropriate and encourage learning and participation.';
	} else if (context === 'game') {
		contextText = 'for a game night. Keep responses lighthearted and fun, perfect for friends and parties.';
	} else {
		contextText = 'for a general group. Respond in a way that is welcoming and easy for beginners to understand.';
	}

	let personaText = '';
	if (persona === 'friendly') {
		personaText = 'You are a friendly coworker who is supportive and positive.';
	} else if (persona === 'sassy') {
		personaText = 'You are a sassy intern who is witty, playful, and a bit cheeky, but always appropriate.';
	} else if (persona === 'professor') {
		personaText = 'You are Professor Bot, wise and knowledgeable, but still approachable and engaging.';
	} else {
		personaText = 'You are a friendly, fun, and engaging conversation starter bot.';
	}

	return {
		role: 'system',
		content: `${personaText} Respond as a conversation starter bot ${contextText}`
	};
}

// Store the last response for each button type
const lastResponses = {
	icebreaker: '',
	fact: '',
	joke: '',
	weather: ''
};

// Helper function to call the OpenAI API and avoid repeats
async function getOpenAIResponse(userPrompt, type, attempt = 1) {
	responseDiv.textContent = 'Thinking...';
	try {
		let prompt = userPrompt;
		if (attempt > 1) {
			prompt += ' Please give a different response than before.';
		}
		const systemMessage = getSystemMessage();
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4.1',
				messages: [systemMessage, { role: 'user', content: prompt }],
				max_tokens: 80,
				temperature: 1.5
			})
		});
		const data = await response.json();
		let content = data.choices?.[0]?.message?.content || 'Sorry, no response.';

		// Try to extract the main question/statement only
		const boldMatch = content.match(/\*\*(.+?)\*\*/);
		if (boldMatch) {
			content = boldMatch[1];
		} else {
			const colonSplit = content.split(':');
			if (colonSplit.length > 1) {
				let afterColon = colonSplit.slice(1).join(':').trim();
				content = afterColon.split('\n')[0].trim();
			} else {
				const lines = content.split('\n').map(line => line.trim()).filter(line => line);
				if (lines.length > 0) {
					content = lines[0];
				}
			}
		}

		if (content === lastResponses[type] && attempt < 3) {
			await getOpenAIResponse(userPrompt, type, attempt + 1);
			return;
		}
		lastResponses[type] = content;
		responseDiv.textContent = content;
	} catch (error) {
		responseDiv.textContent = 'Error: ' + error.message;
	}
}

// Add click event listeners to each button
iceBtn.addEventListener('click', () => {
  // Ask for an icebreaker question
  getOpenAIResponse('Give me a fun icebreaker question for a group.', 'icebreaker');
});

factBtn.addEventListener('click', () => {
  // Ask for a weird or surprising fact
  getOpenAIResponse('Share a weird or surprising fact.', 'fact');
});

jokeBtn.addEventListener('click', () => {
  // Ask for a friendly, clean joke
  getOpenAIResponse('Tell me a friendly, clean joke.', 'joke');
});

weatherBtn.addEventListener('click', () => {
  // Ask for a weather-related prompt to get people sharing
  getOpenAIResponse('Give me a weather-related prompt that gets people sharing what the weather is like for them.', 'weather');
});
