# AI-Based Patient Education

Your personal guide to understanding your health.

## Project Structure

```
├── backend/          # Node.js Express API server
├── frontend/         # Next.js React application
└── README.md         # This file
```

## Features

- **Step 1**: User information collection (name, gender, age, health goals)
- **Step 2**: Condition selection (Diabetes, Heart Health, Pre-Procedure Prep, Mental Wellness)
- **Step 3**: Personalized quiz based on selected condition
- **Step 4**: Goal setting and specific questions
- **Step 5**: AI-powered dashboard with 4 educational cards

## Technology Stack

- **Backend**: Node.js, Express.js, SQLite, OpenAI GPT API
- **Frontend**: Next.js, React, Tailwind CSS
- **AI Integration**: OpenAI GPT-4/GPT-5 for personalized responses

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Supported Conditions and Medications

### Conditions
- Diabetes (💉)
- Heart Health (❤️)
- Pre-Procedure Prep (🏥)
- Mental Wellness (😌)

### Supported Medications
1. Metformin – first-line oral therapy for type 2 diabetes
2. Insulin Glargine (Lantus/Basaglar) – long-acting insulin for diabetes
3. Empagliflozin (Jardiance) – SGLT2 inhibitor, diabetes + heart protection
4. Semaglutide (Ozempic/Rybelsus) – GLP-1 receptor agonist, diabetes + weight management
5. Atorvastatin (Lipitor) – cholesterol lowering, key in heart health
6. Amlodipine – calcium channel blocker, used for high blood pressure
7. Losartan – angiotensin receptor blocker (ARB), hypertension + kidney protection
8. Aspirin (low-dose, 81mg) – antiplatelet for heart protection
9. Sertraline (Zoloft) – SSRI antidepressant, relevant to mental wellness
10. Lorazepam (Ativan) – benzodiazepine, sometimes prescribed short-term for anxiety

## Dashboard Cards

1. **Diagnosis Basics**: Knowledge base about the diagnosis
2. **Nutrition and Carbs**: AI-generated nutrition guidance
3. **Workout**: Video tutorials and tips for exercise
4. **Plan Your Day**: Daily checklist for health management