const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Helper function to call Gemini API with text only
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract text from response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Invalid response format from API');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

// Helper to call Gemini with arbitrary parts (multimodal)
const callGeminiWithParts = async (parts) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid response format from API');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

// Diabetes Risk Prediction
export const predictDiabetesRisk = async (healthData) => {
  try {
    const prompt = `
You are a health assessment AI assistant. Analyze the following health data and assess diabetes risk.
DO NOT provide medical diagnosis. This is for educational purposes only.

Health Data:
- Age: ${healthData.age}
- Gender: ${healthData.gender}
- Height: ${healthData.height} cm
- Weight: ${healthData.weight} kg
- Family History: ${healthData.familyHistory ? 'Yes' : 'No'}
- Activity Level: ${healthData.activity}
- Smoking: ${healthData.smoking ? 'Yes' : 'No'}
- Alcohol: ${healthData.alcohol}
- Diet: ${healthData.diet}
- Sleep: ${healthData.sleep} hours
- Symptoms: ${healthData.symptoms.join(', ') || 'None'}

Return ONLY a valid JSON object with this exact structure:
{
  "risk": "Low|Moderate|High",
  "explanation": "Brief explanation of the risk assessment",
  "tips": "Short lifestyle advice and recommendations"
}

Do not include any markdown formatting, just the raw JSON.
`;

    const text = await callGeminiAPI(prompt);
    
    // Extract JSON from response (remove markdown if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const aiResponse = JSON.parse(jsonMatch[0]);
    return aiResponse;
  } catch (error) {
    console.error('AI Prediction Error:', error);
    throw new Error('Failed to get AI prediction: ' + error.message);
  }
};

// Food Nutrition Analysis
export const analyzeMealNutrition = async (mealText, mealType, imageBase64 = null) => {
  try {
    const prompt = `
You are a nutrition analysis AI assistant. Analyze the following meal description and estimate nutritional values.

Meal Type: ${mealType}
Meal Description: ${mealText}

Return ONLY a valid JSON object with this exact structure:
{
  "calories": number (float),
  "carbs": number (float, in grams),
  "protein": number (float, in grams),
  "fat": number (float, in grams),
  "sugar": number (float, in grams),
  "fiber": number (float, in grams),
  "impact": "Low|Moderate|High",
  "notes": "Short recommendation about this meal for diabetes management"
}

Provide realistic estimates. If the meal description is vague, provide reasonable estimates based on typical servings.
Do not include any markdown formatting, just the raw JSON.
`;

    // Build parts for multimodal request if image is provided
    const parts = [{ text: prompt }];
    if (imageBase64) {
      const cleaned = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      // default to image/jpeg if we can't detect from prefix
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      parts.push({ inline_data: { mime_type: mime, data: cleaned } });
    }

    const text = await callGeminiWithParts(parts);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const aiResponse = JSON.parse(jsonMatch[0]);
    return aiResponse;
  } catch (error) {
    console.error('AI Nutrition Analysis Error:', error);
    throw new Error('Failed to analyze meal nutrition: ' + error.message);
  }
};

// Health Chat Assistant with User Context
export const chatWithAssistant = async (question, userId, userContext = null) => {
  try {
    // Build context section based on available data
    let contextSection = '';
    
    if (userContext) {
      contextSection = '\n\n=== PATIENT HEALTH CONTEXT ===\n';
      
      // Health Assessment Data
      if (userContext.healthAssessment) {
        const ha = userContext.healthAssessment;
        contextSection += `Health Profile:
- Age: ${ha.age}, Gender: ${ha.gender}
- Height: ${ha.height} cm, Weight: ${ha.weight} kg, BMI: ${ha.bmi}
- Diabetes Risk Level: ${ha.riskLevel}
- Activity Level: ${ha.activity}
- Diet Type: ${ha.diet}
- Family History: ${ha.familyHistory ? 'Yes' : 'No'}
- Symptoms: ${ha.symptoms.length > 0 ? ha.symptoms.join(', ') : 'None'}\n`;
      } else {
        contextSection += 'Health Profile: No assessment completed yet.\n';
      }
      
      // Today's Nutrition Summary
      const today = userContext.todaySummary;
      contextSection += `\nToday's Nutrition Intake:
- Total Calories: ${today.calories.toFixed(0)}
- Total Sugar: ${today.sugar.toFixed(1)}g
- Total Carbs: ${today.carbs.toFixed(1)}g
- Protein: ${today.protein.toFixed(1)}g
- Fat: ${today.fat.toFixed(1)}g
- Fiber: ${today.fiber.toFixed(1)}g
- Meals Logged: ${today.mealCount}\n`;
      
      // Recent Meals Pattern
      if (userContext.recentMeals && userContext.recentMeals.length > 0) {
        contextSection += `\nRecent Meal Patterns (Last 10 meals):\n`;
        userContext.recentMeals.slice(0, 5).forEach((meal, idx) => {
          contextSection += `${idx + 1}. ${meal.mealType}: ${meal.calories.toFixed(0)} cal, ${meal.sugar.toFixed(1)}g sugar (${meal.impact} impact)\n`;
        });
        
        // Average sugar per meal
        const avgSugar = userContext.recentMeals.reduce((sum, m) => sum + m.sugar, 0) / userContext.recentMeals.length;
        contextSection += `Average sugar per meal: ${avgSugar.toFixed(1)}g\n`;
      } else {
        contextSection += '\nRecent Meals: No meals logged yet.\n';
      }
      
      // Chat History Context
      if (userContext.chatHistory && userContext.chatHistory.length > 0) {
        contextSection += `\n=== PREVIOUS CONVERSATION HISTORY ===\n`;
        contextSection += `These are the recent conversations with this patient. Reference them naturally when relevant:\n\n`;
        userContext.chatHistory.forEach((chat, idx) => {
          contextSection += `Conversation ${idx + 1} (${chat.date}):\n`;
          contextSection += `Patient: "${chat.question}"\n`;
          contextSection += `Assistant: "${chat.answer.substring(0, 150)}${chat.answer.length > 150 ? '...' : ''}"\n\n`;
        });
        contextSection += `=== END CHAT HISTORY ===\n`;
      } else {
        contextSection += '\nChat History: This is the first conversation.\n';
      }
      
      contextSection += '\n=== END CONTEXT ===\n';
    }

    const prompt = `
You are a friendly and helpful diabetes lifestyle assistant. Your role is to provide personalized lifestyle guidance and nutritional advice based on the patient's health data and previous conversations.

IMPORTANT GUIDELINES:
- DO NOT provide medical diagnosis or prescribe medications
- DO NOT replace professional medical advice
- Keep responses SHORT, SIMPLE, and in HUMAN LANGUAGE (like talking to a friend)
- Use the patient's health and nutrition data to give PERSONALIZED advice
- Be supportive, encouraging, and easy to understand
- Focus on practical tips and actionable suggestions
- Reference specific data from their profile when relevant
- Remember and reference previous conversations naturally
- Show continuity in your responses (e.g., "As we discussed earlier..." or "Remember when you asked about...")
- Always suggest consulting healthcare professionals for serious concerns

${contextSection}

User Question: "${question}"

Instructions:
- Answer in 2-4 short sentences maximum
- Use simple, everyday language (avoid medical jargon)
- Reference their specific health data when relevant
- Reference previous conversations naturally if relevant (e.g., "Like we talked about yesterday..." or "Building on your previous question about...")
- Be conversational and warm, like talking to a friend who remembers past chats
- Give practical, actionable advice they can implement today
- If the question relates to something discussed before, acknowledge it naturally
- Use examples from their actual data (risk level, sugar intake, meal patterns)
- If this question was asked before, provide a slightly different angle or updated information

Provide your response in a natural, conversational way:
`;

    const text = await callGeminiAPI(prompt);
    
    // Clean up response - remove any extra formatting
    let cleanedResponse = text.trim();
    
    // Remove markdown formatting if present
    cleanedResponse = cleanedResponse.replace(/\*\*(.*?)\*\*/g, '$1');
    cleanedResponse = cleanedResponse.replace(/\*(.*?)\*/g, '$1');
    cleanedResponse = cleanedResponse.replace(/`(.*?)`/g, '$1');
    
    // Ensure response is concise (limit to ~200 words)
    const words = cleanedResponse.split(' ');
    if (words.length > 200) {
      cleanedResponse = words.slice(0, 200).join(' ') + '...';
    }
    
    return cleanedResponse.trim();
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw new Error('Failed to get AI response: ' + error.message);
  }
};

