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

// POST /api/ai/generate-dashboard - Generate AI-powered dashboard content
router.post('/generate-dashboard', async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log('AI Dashboard generation request for user:', user_id);

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

      // Parse arrays
      userData.health_goals = userData.health_goals ? userData.health_goals.split(',') : [];
      userData.medications = userData.medications ? userData.medications.split(',') : [];

      try {
        // Generate AI response for each card
        const systemPrompt = generateSystemPrompt(userData);

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