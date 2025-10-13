# Smart Card Limiting Logic

## How It Works:

The system now **intelligently determines** how many cards to show based on the user's selections.

---

## The Formula:

```javascript
Base Cards = 3
+ 1 card per goal selected (up to +3)
- 1 if user has a question (since question card counts as one)
= Optimal Card Count
```

**Maximum:** 6 cards total (including question card)

---

## Examples:

### Example 1: Your Test Case
**User Selections:**
- Goals: 2 (`['Create a relaxing bedtime routine', 'Improve my sleep quality']`)
- Question: Yes (`"How long should I sleep?"`)

**Calculation:**
```
Base: 3 cards
+ Goals: +2 (2 goals selected)
- Question: -1 (has question card)
= 4 cards optimal
```

**Result:**
- ✅ 1 Question card
- ✅ 3 Content cards
- **Total: 4 cards** (instead of 6!)

---

### Example 2: Many Goals, No Question
**User Selections:**
- Goals: 5 goals selected
- Question: No

**Calculation:**
```
Base: 3 cards
+ Goals: +3 (capped at 3, even though 5 selected)
- Question: 0 (no question)
= 6 cards optimal
```

**Result:**
- ✅ 6 Content cards
- **Total: 6 cards**

---

### Example 3: Few Goals, No Question
**User Selections:**
- Goals: 1 goal selected
- Question: No

**Calculation:**
```
Base: 3 cards
+ Goals: +1 (1 goal selected)
- Question: 0 (no question)
= 4 cards optimal
```

**Result:**
- ✅ 4 Content cards
- **Total: 4 cards**

---

### Example 4: No Goals, Just Question
**User Selections:**
- Goals: 0 (shouldn't happen, but if it does)
- Question: Yes

**Calculation:**
```
Base: 3 cards
+ Goals: 0 (no goals)
- Question: -1 (has question)
= 2 cards optimal (minimum enforced)
```

**Result:**
- ✅ 1 Question card
- ✅ 2 High-priority essential cards
- **Total: 3 cards**

---

### Example 5: Maximum Case
**User Selections:**
- Goals: 5+ goals
- Question: Yes

**Calculation:**
```
Base: 3 cards
+ Goals: +3 (capped at 3)
- Question: -1 (has question)
= 5 cards optimal
Max with question: 5 content + 1 question = 6 total (capped)
```

**Result:**
- ✅ 1 Question card
- ✅ 5 Content cards
- **Total: 6 cards** (maximum enforced)

---

## Summary Table:

| Goals Selected | Has Question? | Cards Shown | Total |
|----------------|---------------|-------------|-------|
| 0 | No | 3 | 3 |
| 0 | Yes | 2 + 1 Q | 3 |
| 1 | No | 4 | 4 |
| 1 | Yes | 3 + 1 Q | 4 |
| 2 | No | 5 | 5 |
| 2 | Yes | 4 + 1 Q | 5 |
| 3 | No | 6 | 6 |
| 3 | Yes | 5 + 1 Q | 6 |
| 4 | No | 6 | 6 |
| 4 | Yes | 5 + 1 Q | 6 |
| 5+ | No | 6 | 6 |
| 5+ | Yes | 5 + 1 Q | 6 |

---

## Benefits:

1. ✅ **Adaptive** - Matches user's selection count
2. ✅ **Not Overwhelming** - Never more than 6 cards
3. ✅ **Not Too Few** - Always at least 2-3 cards
4. ✅ **Smart** - Reduces count if question card is present
5. ✅ **Flexible** - Handles all edge cases

---

## For Your Test Case:

**Before:**
- 2 goals + question = 6 cards (too many!)

**After:**
- 2 goals + question = 4 cards ✅

**Console Output:**
```
[Card Filter] 📊 Smart limiting: 2 goals selected
[Card Filter] 📊 Has question: true
[Card Filter] 📊 Optimal card count: 4 cards (+ question card if applicable)
[Card Filter] 📊 Final dashboard: 1 question card + 3 content cards = 4 total
```

---

## The Logic Respects:

- **User Intent** - More goals = more cards
- **Attention Span** - Never overwhelming (max 6)
- **Minimum Value** - Always show at least 2-3 cards
- **Question Priority** - Accounts for question card taking space
- **Mobile UX** - Reasonable scroll length

Perfect balance between flexibility and usability! 🎯

