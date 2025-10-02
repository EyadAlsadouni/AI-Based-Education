const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to generate system prompt based on user data
const generateSystemPrompt = (userData) => {
  return `You are an AI health education assistant. You are helping ${userData.full_name}, a ${userData.age}-year-old ${userData.gender} with ${userData.condition_selected}.

User Context:
- Name: ${userData.full_name}
- Age: ${userData.age}
- Gender: ${userData.gender}
- Condition: ${userData.condition_selected}
- Health Goals: ${userData.health_goals ? userData.health_goals.join(', ') : 'Not specified'}
- Diagnosis Year: ${userData.diagnosis_year || 'Not specified'}
- Takes Medication: ${userData.takes_medication ? 'Yes' : 'No'}
- Medications: ${userData.medications || 'None specified'}
- Checks Vitals: ${userData.checks_vitals || 'Not specified'}
- Main Goals: ${userData.main_goal ? (Array.isArray(userData.main_goal) ? userData.main_goal.join(', ') : userData.main_goal) : 'Not specified'}
- Main Question: ${userData.main_question || 'Not specified'}
- Knowledge Level: ${userData.knowledge_level || 'Not specified'}
- Main Interests: ${userData.main_interests ? (Array.isArray(userData.main_interests) ? userData.main_interests.join(', ') : userData.main_interests) : 'Not specified'}
- Learning Style: ${userData.learning_style || 'Not specified'}
- Other Knowledge: ${userData.other_knowledge || 'Not specified'}
${userData.main_question && userData.main_question.includes('medication') ? 'NOTE: User asked about medications - provide educational info only, redirect to doctor for medical advice' : ''}

IMPORTANT GUIDELINES:
1. Provide educational information only - NEVER give medical advice
2. NEVER recommend specific medications, dosages, or treatments
3. NEVER diagnose symptoms or interpret test results
4. NEVER suggest when to seek emergency care (direct to 911/emergency services)
5. Always recommend consulting healthcare providers for medical decisions
6. Be empathetic, supportive, and encouraging
7. Use simple, clear language appropriate for patient education
8. Focus on evidence-based information
9. Be specific to their condition and goals
10. Provide actionable, practical advice when appropriate
11. If user asks medical advice questions, redirect them to consult their doctor

Your responses should be structured to help create 4 educational cards:
1. Diagnosis Basics - Core knowledge about their condition
2. Nutrition and Carbs - Dietary guidance specific to their condition
3. Workout - Safe exercise recommendations for their condition
4. Plan Your Day - Daily management checklist and tips

Keep responses informative but conversational, and always maintain a supportive tone.`;
};

// Helper function to generate prompts for dynamic cards
const generateDynamicCardPrompt = (card, userData) => {
  const learningStyle = userData.learning_style || 'step_by_step';
  const condition = userData.condition_selected;
  const mainInterests = userData.main_interests ? userData.main_interests.join(', ') : '';
  const mainGoals = userData.main_goal ? userData.main_goal.join(', ') : '';
  
  let basePrompt = `Generate educational content for: ${card.title}
  
Description: ${card.description}
Condition: ${condition}
User's Main Interests: ${mainInterests}
User's Main Goals: ${mainGoals}
Knowledge Level: ${userData.knowledge_level || 'new'}

Content Requirements:`;

  // Adapt content based on learning style
  if (learningStyle === 'videos') {
    basePrompt += `
- Include 2-3 specific YouTube video links from reputable medical/health channels
- Focus on visual demonstrations and step-by-step video tutorials
- Recommend videos from channels like: Mayo Clinic, Cleveland Clinic, American Heart Association, or similar medical institutions
- Format video links as: https://www.youtube.com/watch?v=VIDEO_ID
- Ensure videos are from 2020 or newer for accuracy`;
  } else if (learningStyle === 'step_by_step') {
    basePrompt += `
- Provide detailed, step-by-step instructions
- Use numbered lists and clear headings
- Include specific actions the user can take
- Break down complex processes into manageable steps`;
  } else if (learningStyle === 'quick_tips') {
    basePrompt += `
- Provide concise, scannable information
- Use bullet points and short paragraphs
- Focus on key takeaways and practical tips
- Make it easy to read quickly`;
  }

  // Add specific content based on card type
  if (card.id.includes('technique') || card.id.includes('use')) {
    basePrompt += `
- Include detailed technique instructions
- Explain common mistakes to avoid
- Provide troubleshooting tips
- Include safety considerations`;
  } else if (card.id.includes('management') || card.id.includes('monitoring')) {
    basePrompt += `
- Explain how to track progress
- Include signs of improvement or concern
- Provide practical monitoring strategies
- Include when to seek help`;
  } else if (card.id.includes('preparation') || card.id.includes('prep')) {
    basePrompt += `
- Provide timeline-based preparation steps
- Include what to bring and what to avoid
- Explain what to expect during the process
- Include post-procedure care instructions`;
  } else if (card.id.includes('safety') || card.id.includes('emergency')) {
    basePrompt += `
- Include warning signs to watch for
- Explain when to seek immediate help
- Provide emergency contact information
- Include safety precautions and storage tips`;
  }

  basePrompt += `

IMPORTANT REQUIREMENTS:
- Include 2-4 real, credible references from reputable medical sources
- Use numbered references [1], [2], etc. within the text where appropriate
- At the end, include a "References:" section with full citations
- Sources should be from: Mayo Clinic, American Medical Association, CDC, WebMD, Healthline, or similar reputable medical sources
- Ensure all referenced URLs are real and working
- Keep content under 500 words including references
- Make it beginner-friendly and easy to understand
- Focus on practical, actionable advice`;

  return basePrompt;
};

// POST /api/ai/generate-dashboard - Generate AI-powered dashboard content
router.post('/generate-dashboard', async (req, res) => {
  try {
    const { user_id, dynamic_cards } = req.body;
    console.log('POST /generate-dashboard called for user:', user_id);
    console.log('Dynamic cards received:', dynamic_cards ? dynamic_cards.length : 'none');

    if (!user_id) {
      console.log('Missing user_id in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user session data
    const query = `
      SELECT us.*, u.full_name, u.gender, u.age, u.health_goals 
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.user_id = ?
    `;

    db.get(query, [user_id], async (err, userData) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ error: 'Failed to fetch user data' });
      }

      if (!userData) {
        return res.status(404).json({ error: 'User session not found' });
      }

      // Parse arrays - handle both string and array formats
      userData.health_goals = userData.health_goals ? 
        (Array.isArray(userData.health_goals) ? userData.health_goals : userData.health_goals.split(',')) : [];
      userData.medications = userData.medications ? 
        (Array.isArray(userData.medications) ? userData.medications : userData.medications.split(',')) : [];
      userData.main_interests = userData.main_interests ? 
        (Array.isArray(userData.main_interests) ? userData.main_interests : userData.main_interests.split(',')) : [];
      userData.main_goal = userData.main_goal ? 
        (Array.isArray(userData.main_goal) ? userData.main_goal : userData.main_goal.split(',')) : [];

      try {
        // Generate AI response for each card
        const systemPrompt = generateSystemPrompt(userData);

        // Handle dynamic cards if provided
        if (dynamic_cards && dynamic_cards.length > 0) {
          console.log('Generating content for dynamic cards:', dynamic_cards.length);
          
          // Clear any existing content in database first
          console.log('Clearing existing content from database...');
          db.run('UPDATE user_sessions SET ai_response = NULL WHERE user_id = ?', [user_id], function(err) {
            if (err) {
              console.error('Error clearing existing content:', err);
            } else {
              console.log('Successfully cleared existing content from database');
            }
          });
          
          const dynamicContent = {};
          
          // Generate content for each dynamic card
          for (const card of dynamic_cards) {
            const cardPrompt = generateDynamicCardPrompt(card, userData);
            
            try {
              const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: cardPrompt }
                ],
                max_tokens: 600,
                temperature: 0.7
              });
              
              dynamicContent[card.contentKey] = response.choices[0].message.content;
              console.log(`Generated content for card: ${card.title} (${card.contentKey})`);
            } catch (cardError) {
              console.error(`Error generating content for card ${card.title}:`, cardError);
              dynamicContent[card.contentKey] = `Content for ${card.title} is temporarily unavailable. Please try again later.`;
            }
          }
          
          // Save AI response to database
          const aiResponseString = JSON.stringify(dynamicContent);
          console.log('Saving dynamic content to database:', Object.keys(dynamicContent));
          db.run('UPDATE user_sessions SET ai_response = ? WHERE user_id = ?', [aiResponseString, user_id], function(err) {
            if (err) {
              console.error('Error saving AI response:', err);
            } else {
              console.log('Successfully saved dynamic content to database');
              // Verify the content was saved correctly
              db.get('SELECT ai_response FROM user_sessions WHERE user_id = ?', [user_id], (verifyErr, verifyRow) => {
                if (verifyErr) {
                  console.error('Error verifying saved content:', verifyErr);
                } else {
                  console.log('Verified saved content keys:', Object.keys(JSON.parse(verifyRow.ai_response || '{}')));
                }
              });
            }
          });
          
          console.log('Sending dynamic content to frontend:', Object.keys(dynamicContent));
          
          res.json({
            success: true,
            dashboard: dynamicContent,
            user_context: {
              name: userData.full_name,
              condition: userData.condition_selected,
              main_goals: Array.isArray(userData.main_goal) ? userData.main_goal : [userData.main_goal]
            }
          });
          
          return;
        }

        console.log('No dynamic cards, generating legacy content');

        // Card 1: Diagnosis Basics
        const diagnosisPrompt = `Generate educational content about ${userData.condition_selected} basics. Include:
        - What is ${userData.condition_selected}?
        - Key symptoms to monitor
        - How it affects the body
        - General management principles
        
        IMPORTANT REQUIREMENTS:
        - Include 3-4 real, credible references from reputable medical sources
        - Use numbered references [1], [2], etc. within the text where appropriate
        - At the end, include a "References:" section with full citations
        - Sources should be from: Mayo Clinic, American Diabetes Association, WebMD, Healthline, PubMed, CDC, or similar reputable medical sources
        - Ensure all referenced URLs are real and working
        
        Format example:
        "Diabetes is a chronic condition that affects blood sugar levels [1]. Regular monitoring is essential [2].
        
        References:
        [1] Mayo Clinic. Diabetes Overview. https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444
        [2] American Diabetes Association. Blood Glucose Monitoring. https://diabetes.org/healthy-living/medication-treatments/blood-glucose-testing"
        
        Keep it under 350 words including references and be beginner-friendly.`;

        // Card 2: Nutrition and Carbs
        const nutritionPrompt = `Provide nutrition guidance for ${userData.condition_selected}. Include:
        - Foods to focus on
        - Foods to limit or avoid
        - Meal planning tips
        - ${userData.condition_selected === 'Diabetes' ? 'Carbohydrate counting basics' : 'Dietary considerations'}
        
        IMPORTANT REQUIREMENTS:
        - Include 3-4 real, credible references from reputable medical/nutrition sources
        - Use numbered references [1], [2], etc. within the text where appropriate
        - At the end, include a "References:" section with full citations
        - Sources should be from: Mayo Clinic, American Heart Association, Academy of Nutrition and Dietetics, Harvard Health, Cleveland Clinic, or similar reputable sources
        - Ensure all referenced URLs are real and working
        
        Keep it under 350 words including references and practical.`;

        // Card 3: Workout
        const workoutPrompt = `Suggest safe exercise recommendations for someone with ${userData.condition_selected}. Include:
        - Recommended types of exercise
        - Safety considerations
        - How to start gradually
        - Warning signs to stop
        - CRITICAL: Include 3-4 specific YouTube video links for ${userData.condition_selected}-friendly workouts
        - ONLY recommend videos from well-established, popular fitness channels that are highly likely to still be available
        - Focus on channels like: Yoga with Adriene, FitnessBlender, SilverSneakers, HASfit, or Fitness with Cindy
        - Suggest videos that are typically from 2020 or newer (more recent = better)
        - Format video links as: https://www.youtube.com/watch?v=VIDEO_ID
        - Provide both beginner and intermediate level recommendations
        - Avoid recommending videos from small or inactive channels
        
        IMPORTANT REQUIREMENTS:
        - Include 2-3 real, credible references from reputable medical/fitness sources
        - Use numbered references [1], [2], etc. within the text where appropriate
        - At the end, include a "References:" section with full citations
        - Sources should be from: Mayo Clinic, American Heart Association, CDC Physical Activity Guidelines, ACSM, or similar reputable sources
        - Ensure all referenced URLs are real and working
        
        Keep it under 450 words including references and actionable.`;

        // Card 4: Plan Your Day
        const dailyPlanPrompt = `Create a daily management checklist for ${userData.condition_selected}. Include:
        - Morning routine items
        - Throughout the day reminders
        - Evening tasks
        - Self-monitoring tips
        
        IMPORTANT REQUIREMENTS:
        - Include 2-3 real, credible references from reputable medical sources
        - Use numbered references [1], [2], etc. within the text where appropriate
        - At the end, include a "References:" section with full citations
        - Sources should be from: Mayo Clinic, CDC, American Medical Association, or similar reputable medical sources
        - Ensure all referenced URLs are real and working
        
        Format as a practical checklist under 350 words including references.`;

        const prompts = [
          { type: 'diagnosis', prompt: diagnosisPrompt },
          { type: 'nutrition', prompt: nutritionPrompt },
          { type: 'workout', prompt: workoutPrompt },
          { type: 'daily_plan', prompt: dailyPlanPrompt }
        ];

        const responses = await Promise.all(
          prompts.map(async ({ type, prompt }) => {
            let maxTokens;
            switch (type) {
              case 'workout':
                maxTokens = 700; // More tokens for workout content with video links and references
                break;
              case 'diagnosis':
              case 'nutrition':
              case 'daily_plan':
                maxTokens = 550; // More tokens for content with references
                break;
              default:
                maxTokens = 400;
            }
            
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              max_tokens: maxTokens,
              temperature: 0.7
            });

            return {
              type,
              content: response.choices[0].message.content
            };
          })
        );

        // Combine all responses
        const dashboardContent = {
          diagnosis_basics: responses.find(r => r.type === 'diagnosis')?.content || '',
          nutrition_carbs: responses.find(r => r.type === 'nutrition')?.content || '',
          workout: responses.find(r => r.type === 'workout')?.content || '',
          daily_plan: responses.find(r => r.type === 'daily_plan')?.content || ''
        };

        // Save AI response to database
        const aiResponseString = JSON.stringify(dashboardContent);
        
        db.run(
          'UPDATE user_sessions SET ai_response = ? WHERE user_id = ?',
          [aiResponseString, user_id],
          function(err) {
            if (err) {
              console.error('Error saving AI response:', err);
            }
          }
        );

        res.json({
          success: true,
          dashboard: dashboardContent,
          user_context: {
            name: userData.full_name,
            condition: userData.condition_selected,
            main_goals: Array.isArray(userData.main_goal) ? userData.main_goal : [userData.main_goal]
          }
        });

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        console.error('OpenAI error details:', {
          message: openaiError.message,
          status: openaiError.status,
          type: openaiError.type
        });
        
        // Fallback content if OpenAI fails
        const fallbackContent = {
          diagnosis_basics: `Learn about ${userData.condition_selected} and how it affects your body. Understanding your condition is the first step toward better management.`,
          nutrition_carbs: `Proper nutrition plays a crucial role in managing ${userData.condition_selected}. Focus on balanced meals and work with your healthcare team.`,
          workout: `Regular physical activity can help manage ${userData.condition_selected}. Start slowly and consult your doctor before beginning any exercise program.`,
          daily_plan: `Create a daily routine that includes medication reminders, health monitoring, and lifestyle habits that support your ${userData.condition_selected} management.`
        };

        res.json({
          success: true,
          dashboard: fallbackContent,
          user_context: {
            name: userData.full_name,
            condition: userData.condition_selected,
            main_goals: Array.isArray(userData.main_goal) ? userData.main_goal : [userData.main_goal]
          },
          note: 'Using fallback content due to AI service limitations'
        });
      }
    });

  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Failed to generate dashboard content' });
  }
});

// GET /api/ai/dashboard/:user_id - Get saved dashboard content
router.get('/dashboard/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const query = `
    SELECT us.ai_response, us.condition_selected, us.main_goal, u.full_name 
    FROM user_sessions us 
    JOIN users u ON us.user_id = u.id 
    WHERE us.user_id = ?
  `;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching dashboard:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    let dashboard = {};
    if (row.ai_response) {
      try {
        dashboard = JSON.parse(row.ai_response);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        dashboard = {};
      }
    }

    res.json({
      success: true,
      dashboard,
      user_context: {
        name: row.full_name,
        condition: row.condition_selected,
        main_goal: row.main_goal
      }
    });
  });
});

module.exports = router;