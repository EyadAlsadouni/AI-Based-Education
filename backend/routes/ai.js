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

IMPORTANT: Generate content that is specific to the requested card topic only. Do not include generic card titles or structures. Focus on providing educational content that directly addresses the specific card's title and description.

CRITICAL: Every response MUST include a "References:" section with 2-3 real, working URLs from trusted medical sources (Mayo Clinic, CDC, ADA, AHA, WebMD, Healthline). Use [1], [2], [3] format in the text and provide full citations with working URLs.

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

IMPORTANT: This card was selected because the user has a KNOWLEDGE GAP in this area. 
The user's main interests (${mainInterests}) represent what they already know, so this content 
should focus on what they DON'T know about ${card.title}.

Content Requirements:`;

  // Adapt content depth based on knowledge level
  if (userData.knowledge_level === 'new') {
    basePrompt += `
- Start with basic concepts and fundamentals
- Explain terminology and key concepts clearly
- Provide step-by-step guidance for beginners
- Include "what you need to know first" information`;
  } else if (userData.knowledge_level === 'some') {
    basePrompt += `
- Build on existing knowledge with intermediate concepts
- Focus on practical application and implementation
- Include troubleshooting and common challenges
- Provide actionable strategies and tips`;
  } else if (userData.knowledge_level === 'experienced') {
    basePrompt += `
- Focus on advanced strategies and optimization
- Include latest research and best practices
- Provide nuanced insights and expert-level information
- Address complex scenarios and edge cases`;
  }

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

CRITICAL INSTRUCTIONS:
- DO NOT include generic card titles like "Card 1: Diagnosis Basics", "Card 2: Nutrition and Carbs", "Card 3: Workout", or "Card 4: Plan Your Day"
- DO NOT structure your response as multiple cards or sections
- Focus ONLY on the specific topic: ${card.title}
- Write content that directly addresses the card's description: ${card.description}
- Do not include introductory phrases that reference other card types

MANDATORY REQUIREMENTS:
- ALWAYS include 2-3 credible medical references with [1], [2], [3] format in the text
- ALWAYS add a "References:" section at the end with full citations and working URLs
- Use ONLY these trusted sources with their exact URLs:
  * Mayo Clinic: https://www.mayoclinic.org/
  * CDC (Centers for Disease Control): https://www.cdc.gov/
  * American Diabetes Association: https://diabetes.org/
  * American Heart Association: https://www.heart.org/
  * WebMD: https://www.webmd.com/
  * Healthline: https://www.healthline.com/
- Ensure ALL URLs are real and accessible (test them)
- Keep under 500 words total (you have enough tokens to include complete content and references)
- Make it beginner-friendly and actionable
- Write as a single, focused piece of content about ${card.title}

EXAMPLE REFERENCE FORMAT:
References:
[1] Mayo Clinic. "Diabetes management: How lifestyle affects blood sugar." https://www.mayoclinic.org/diseases-conditions/diabetes/in-depth/diabetes-management/art-20047963
[2] CDC. "Managing Diabetes." https://www.cdc.gov/diabetes/managing/index.html

IMPORTANT: 
- Use the EXACT URLs provided above for each organization
- Ensure URLs are complete and include the full path
- Test that URLs are accessible and lead to relevant content
- Always end your response with the References section
- DO NOT cut off mid-sentence - ensure your response is complete
- The References section is MANDATORY and must be included`;

  return basePrompt;
};

// Sanitize AI content to remove any legacy card headings or generic templates
const sanitizeAIContent = (content, cardTitle = '') => {
  if (!content || typeof content !== 'string') return content;
  let sanitized = content;

  // Remove lines like: "Card 1: Diagnosis Basics - ..." or any "Card X:" heading
  sanitized = sanitized.replace(/^\s*Card\s*\d+\s*:\s*.*$/gmi, '').trim();

  // Remove legacy generic section headings if present at line starts
  const legacyHeadings = [
    'Diagnosis Basics',
    'Nutrition and Carbs',
    'Nutrition',
    'Workout',
    'Plan Your Day',
  ];
  const legacyPattern = new RegExp(
    `^\s*(?:${legacyHeadings
      .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})(?:\s*-.*)?$`,
    'gmi'
  );
  sanitized = sanitized.replace(legacyPattern, '').trim();

  // If the AI echoed the card title as a heading, keep it but ensure no leading numbering
  if (cardTitle) {
    const numberedTitle = new RegExp(`^\s*Card\s*\d+\s*:\\s*${cardTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'gmi');
    sanitized = sanitized.replace(numberedTitle, '').trim();
  }

  // Collapse excessive blank lines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Validate that references are present
  const hasReferences = sanitized.toLowerCase().includes('references:') || 
                       sanitized.includes('[1]') || 
                       sanitized.includes('[2]') || 
                       sanitized.includes('[3]');
  
  if (!hasReferences) {
    console.warn(`Warning: Generated content for "${cardTitle}" is missing references`);
    // Add a note to the content about missing references
    sanitized += '\n\nNote: References are being generated. Please refresh to see complete citations.';
  }

  return sanitized;
};

// Add fallback references if missing
const ensureReferences = (content, cardTitle, condition) => {
  if (!content || typeof content !== 'string') return content;
  
  const hasReferences = content.toLowerCase().includes('references:') || 
                       content.includes('[1]') || 
                       content.includes('[2]') || 
                       content.includes('[3]');
  
  if (!hasReferences) {
    console.log(`Adding fallback references for: ${cardTitle}`);
    
    // Generate condition-specific fallback references
    let fallbackRefs = '';
    if (condition.toLowerCase().includes('diabetes')) {
      fallbackRefs = `
References:
[1] Mayo Clinic. "Diabetes management: How lifestyle affects blood sugar." https://www.mayoclinic.org/diseases-conditions/diabetes/in-depth/diabetes-management/art-20047963
[2] CDC. "Managing Diabetes." https://www.cdc.gov/diabetes/managing/index.html
[3] American Diabetes Association. "Living with Diabetes." https://diabetes.org/living-with-diabetes`;
    } else if (condition.toLowerCase().includes('heart') || condition.toLowerCase().includes('blood pressure')) {
      fallbackRefs = `
References:
[1] Mayo Clinic. "High blood pressure (hypertension)." https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410
[2] American Heart Association. "Understanding Blood Pressure Readings." https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings
[3] CDC. "High Blood Pressure." https://www.cdc.gov/bloodpressure/index.htm`;
    } else if (condition.toLowerCase().includes('asthma') || condition.toLowerCase().includes('respiratory')) {
      fallbackRefs = `
References:
[1] Mayo Clinic. "Asthma." https://www.mayoclinic.org/diseases-conditions/asthma/symptoms-causes/syc-20369653
[2] CDC. "Asthma." https://www.cdc.gov/asthma/default.htm
[3] American Lung Association. "Learn About Asthma." https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma/learn-about-asthma`;
    } else {
      // Generic fallback
      fallbackRefs = `
References:
[1] Mayo Clinic. "Patient Care & Health Information." https://www.mayoclinic.org/patient-care-and-health-information
[2] CDC. "Health Topics A-Z." https://www.cdc.gov/health-topics.html
[3] WebMD. "Health & Balance." https://www.webmd.com/balance/default.htm`;
    }
    
    return content + fallbackRefs;
  }
  
  return content;
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
          
          // Generate content for all dynamic cards in parallel
          const cardPromises = dynamic_cards.map(async (card) => {
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
              
              console.log(`Generated content for card: ${card.title} (${card.contentKey})`);
              console.log(`Raw AI response length: ${response.choices[0].message.content.length} characters`);
              console.log(`Raw AI response preview: ${response.choices[0].message.content.substring(0, 300)}...`);
              console.log(`Raw AI response ends with: ...${response.choices[0].message.content.slice(-200)}`);
              
              // Check if response was truncated due to token limit
              let finalContent = response.choices[0].message.content;
              if (response.choices[0].finish_reason === 'length') {
                console.warn(`WARNING: AI response for ${card.title} was truncated due to token limit!`);
                console.log('Attempting to complete the response...');
                
                try {
                  // Make a second API call to complete the response
                  const completionResponse = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: cardPrompt },
                      { role: 'assistant', content: finalContent },
                      { role: 'user', content: 'Please complete the previous response, especially the References section with working URLs.' }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                  });
                  
                  finalContent += completionResponse.choices[0].message.content;
                  console.log(`Completed response length: ${finalContent.length} characters`);
                } catch (completionError) {
                  console.error('Error completing truncated response:', completionError);
                }
              }
              
              const sanitizedContent = sanitizeAIContent(response.choices[0].message.content, card.title);
              console.log(`Sanitized content length: ${sanitizedContent.length} characters`);
              
              const contentWithReferences = ensureReferences(sanitizedContent, card.title, userData.condition_selected);
              console.log(`Final content length: ${contentWithReferences.length} characters`);
              console.log(`Final content ends with: ...${contentWithReferences.slice(-200)}`);
              
              return {
                contentKey: card.contentKey,
                content: contentWithReferences
              };
            } catch (cardError) {
              console.error(`Error generating content for card ${card.title}:`, cardError);
              return {
                contentKey: card.contentKey,
                content: `Content for ${card.title} is temporarily unavailable. Please try again later.`
              };
            }
          });

          // Wait for all cards to be generated in parallel
          const cardResults = await Promise.all(cardPromises);
          
          // Store results in dynamicContent
          cardResults.forEach(result => {
            dynamicContent[result.contentKey] = result.content;
            console.log(`Storing content for ${result.contentKey}: ${result.content.length} characters`);
            console.log(`Content preview: ${result.content.substring(0, 200)}...`);
            console.log(`Content ends with: ...${result.content.slice(-200)}`);
          });
          
          // Save AI response to database
          const aiResponseString = JSON.stringify(dynamicContent);
          console.log('Saving dynamic content to database:', Object.keys(dynamicContent));
          console.log('Total JSON string length:', aiResponseString.length);
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