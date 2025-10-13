# 🧪 Voice Agent Testing Guide

## Quick Test Checklist

Run through these tests to verify all fixes are working:

### ✅ Test 1: "Thinking..." Issue
**Time**: 2 minutes

1. Open dashboard with voice agent
2. Click mic → speak "hello" → click mic to stop
3. **VERIFY**: Response appears within 5 seconds (not stuck on "Thinking...")
4. Ask 3 more questions in a row
5. **VERIFY**: Each response appears quickly

**Expected**: No stuck "Thinking..." messages. All responses appear within 5-10 seconds.

---

### ✅ Test 2: Smooth Voice/Text
**Time**: 3 minutes

1. Ask "Tell me about my first card"
2. **VERIFY**: Text appears smoothly as voice plays
3. **VERIFY**: Text doesn't finish before voice
4. **VERIFY**: Text stops when voice stops (not continuing)
5. Try 2 more longer questions
6. **VERIFY**: Text-audio sync is smooth throughout

**Expected**: Text reveals smoothly in sync with audio. No stuttering or jumping.

---

### ✅ Test 3: Dashboard Updates
**Time**: 5 minutes

1. Open dashboard voice agent
2. Ask "How many cards do I have?"
3. **WRITE DOWN THE ANSWER**: _________
4. Go back to Step 4 (Basic Information)
5. Change your answers (e.g., select different main interests)
6. Click "Create Dashboard"
7. Wait for new dashboard to generate
8. **VERIFY**: Dashboard shows different cards than before
9. Ask voice agent "How many cards do I have?"
10. **VERIFY**: AI reports NEW count (not the old one you wrote down)

**Expected**: AI knows about the new dashboard and reports current card count.

---

### ✅ Test 4: Latest Question Answered
**Time**: 3 minutes

1. Ask "What's my first card about?"
2. While AI is responding, click STOP button
3. Immediately ask "How many cards do I have?"
4. **VERIFY**: AI answers the card count question (not continuing first answer)
5. Ask with voice → interrupt → ask with text
6. **VERIFY**: AI answers the text question
7. Ask question A → ask question B immediately
8. **VERIFY**: AI answers question B

**Expected**: AI always answers the LATEST question, never previous ones.

---

### ✅ Test 5: No Empty Errors
**Time**: 2 minutes

1. Open browser console (F12)
2. Use voice agent normally for 5 interactions
3. **CHECK CONSOLE**: Look for "Realtime API error details: {}"
4. **CHECK UI**: Look for blank error popups
5. **VERIFY**: No empty errors shown in UI
6. **VERIFY**: Empty errors only in console (if any)

**Expected**: No empty error messages shown to user. Console may log them but UI stays clean.

---

## 🚀 Full Integration Test

**Time**: 10 minutes

Run through a complete user flow:

1. **Start Fresh**
   - Go to Step 1
   - Complete all steps with new data
   - Generate dashboard

2. **Test Voice Agent**
   - Open voice agent
   - Ask 3 questions (mix of voice and text)
   - Verify all responses work

3. **Test Interruption**
   - Start a long response
   - Interrupt mid-way
   - Ask new question
   - Verify new answer appears

4. **Test Dashboard Update**
   - Note current card count
   - Go back to Step 4
   - Change answers
   - Regenerate dashboard
   - Ask voice agent about card count
   - Verify updated count

5. **Test Error Recovery**
   - Ask a question
   - Close and reopen voice agent
   - Ask another question
   - Verify it works

**Expected**: Everything works smoothly throughout the entire flow.

---

## 🐛 If You Find Issues

### Issue: Still stuck on "Thinking..."
**Check**:
1. Browser console - any red errors?
2. Network tab - WebSocket connected?
3. Try refreshing the page

**Debug in console**:
```javascript
// Check state
realtimeSession.isConnected
realtimeSession.isProcessing

// Force reset (emergency)
hasActiveResponseRef.current = false
realtimeSession.clearBuffers()
```

---

### Issue: Text still out of sync
**Check**:
1. Is text too fast? (finishes before audio)
2. Is text too slow? (continues after audio)

**Adjust in code**:
```typescript
// In useOpenAIRealtime.ts line ~37
const charsPerSecondRef = useRef<number>(12); // Try 10 or 14
```

---

### Issue: AI not updating with new data
**Check**:
1. Browser console for "[Dashboard Agent] 🔄 Dashboard data changed!"
2. If message doesn't appear, dashboard change not detected

**Debug**:
```javascript
// Check current values
lastCardCountRef.current
dashboardCards.length
```

---

### Issue: Empty errors still showing
**Check**:
1. Browser console - what does the error object contain?
2. Take screenshot and check the error format

**Add to detection**:
```typescript
// In useOpenAIRealtime.ts, add new pattern to isEmptyError check
const isEmptyError = /* existing checks */ ||
                    yourNewEmptyPattern;
```

---

## ✨ Success Criteria

All tests should pass with:
- ✅ No stuck "Thinking..." messages
- ✅ Smooth text-audio synchronization
- ✅ AI knows current dashboard data
- ✅ Always answers latest question
- ✅ No empty error messages in UI
- ✅ Fast, responsive interactions (5-10s response time)
- ✅ Reliable interruption and restart
- ✅ Clean console (no unexpected errors)

---

## 📊 Performance Expectations

### Response Times
- Text message → Response: **5-10 seconds**
- Voice message → Response: **5-10 seconds**
- Stop → New question: **Immediate**
- Interrupt → New question: **Immediate**

### Stability
- **Success rate**: 95%+ (19 out of 20 questions work)
- **Stuck rate**: <2% (less than 1 in 50 gets stuck)
- **Recovery time**: <5 seconds (auto-timeout fixes stuck states)

---

## 🎯 Quick Smoke Test (30 seconds)

Do this before every demo:

1. Open dashboard
2. Click voice agent FAB
3. Ask "How many cards do I have?"
4. Wait for response
5. **IF IT WORKS**: You're good to go! ✅
6. **IF IT'S STUCK**: Refresh and try again, or check console for errors

---

**Last Updated**: January 2025  
**Version**: 2.0
