# "Your Question Answered" Card Implementation

## What Was Added:

A special card that appears **first** on the dashboard when the user asks a question in Step 4.

---

## How It Works:

### 1. **Frontend (Card Generation)**

**File:** `frontend/lib/constants.ts`

When user provides a `main_question` in Step 4:
```javascript
const questionCard = {
  id: 'user_question',
  title: 'Your Question Answered',
  description: '[User's question preview]',
  icon: '❓',
  contentKey: 'user_question',
  priority: 0, // Highest priority - shows FIRST
  userQuestion: '[Full question text]'
}
```

**Conditions:**
- Only created if `main_question` exists
- Only created if question is > 10 characters (filters out empty/very short)
- Always appears as the **first card** (before all others)

---

### 2. **Backend (Content Generation)**

**File:** `backend/routes/ai.js`

Special AI prompt for `user_question` card:
```javascript
if (card.contentKey === 'user_question') {
  // Use custom prompt that:
  // 1. Focuses on answering the EXACT question
  // 2. Provides context (age, gender, condition)
  // 3. Gives direct, clear answer
  // 4. Includes references
}
```

**AI Instructions:**
- Answer the exact question directly
- Keep it concise (3-4 paragraphs)
- Use appropriate language for knowledge level
- Include specific numbers/guidance if asked (e.g., "7-9 hours of sleep")
- Provide 2-3 credible references

---

## Example Flow:

### User Input (Step 4):
```
Question: "If I'm a 23-year-old male, how much sleep should I get every day?"
```

### Cards Generated:
```
1. ❓ Your Question Answered (Priority: 0 - FIRST)
   Content: "**Direct Answer:** As a 23-year-old male, you should aim for 7-9 hours 
   of sleep per night..."

2. 😴 Sleep Hygiene (Priority: 2)
   Content: "To create healthy sleep habits and routines..."

3. 🛌 Understanding Sleep Issues (Priority: 3)
   Content: "Common sleep problems can affect your overall health..."
```

---

## What User Sees:

**Dashboard:**
```
┌─────────────────────────────────────┐
│ ❓ Your Question Answered           │
│ If I'm a 23-year-old male, how...  │
│ [Click to see full answer]          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 😴 Sleep Hygiene                    │
│ Creating healthy sleep habits...    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🛌 Understanding Sleep Issues       │
│ Common sleep problems can affect... │
└─────────────────────────────────────┘
```

**When clicked, the "Your Question" card shows:**
```
**Direct Answer:** As a 23-year-old male, you should aim for 
7-9 hours of sleep per night for optimal health and well-being.

**Key Information:**
- Young adults (18-25) need 7-9 hours according to sleep research
- Individual needs vary based on activity level and health
- Consistency is more important than exact hours

**Additional Context:** Quality matters as much as quantity. Focus 
on maintaining a regular sleep schedule...

References:
[1] National Sleep Foundation. "How Much Sleep Do We Really Need?"
[2] Mayo Clinic. "Sleep tips: 6 steps to better sleep"
```

---

## Files Changed:

### Frontend:
- ✅ `frontend/lib/constants.ts` - Card generation logic
- ✅ `frontend/components/steps/Step4.tsx` - Pass `main_question` parameter
- ✅ `frontend/components/steps/Dashboard.tsx` - Pass `main_question` parameter

### Backend:
- ✅ `backend/routes/ai.js` - Special prompt for "Your Question" card

---

## Benefits:

1. ✅ **User sees their question was heard** - Question appears as first card
2. ✅ **Direct, focused answer** - Not buried in long content
3. ✅ **Personalized** - Uses their age, gender, condition in the answer
4. ✅ **Prominent placement** - Always first card (priority 0)
5. ✅ **Optional** - Only appears if user asks a question
6. ✅ **Educational** - Includes references and additional context

---

## Testing:

**Test Case 1: User asks a question**
- Question: "How much sleep should I get?"
- Expected: 3 cards (Your Question + 2 others)
- Your Question card shows FIRST

**Test Case 2: User doesn't ask a question**
- Question: [empty]
- Expected: 2 cards (just the regular cards)
- No "Your Question" card

**Test Case 3: User asks a very short question**
- Question: "Why?"
- Expected: 2 cards (filtered out - too short)
- No "Your Question" card

---

## Will It Generate the Right Answer?

**YES!** Because:

1. ✅ **AI receives the exact question** via `card.userQuestion`
2. ✅ **AI receives user context** (age, gender, condition, knowledge level)
3. ✅ **Specific instructions** to answer directly and concisely
4. ✅ **Example structure** showing how to format the answer
5. ✅ **GPT-4o model** is smart enough to answer health questions accurately
6. ✅ **References required** ensures credible information

**The AI is explicitly told:**
- "Answer their EXACT question directly and clearly"
- "If the question asks about specific numbers/amounts, give clear guidance"
- Uses user's age/gender/condition to personalize the answer

**So for "How much sleep should I get?":**
- AI will recognize it's asking for a specific number
- AI will use the age (23) and gender (male) to give targeted advice
- AI will provide "7-9 hours" based on sleep research
- AI will include references from National Sleep Foundation, Mayo Clinic, etc.

---

## Ready to Test! 🎉

Complete Step 4 with a question and you should see:
1. First card: "Your Question Answered" with direct answer
2. Remaining cards: Based on your goals (Sleep Hygiene, etc.)

