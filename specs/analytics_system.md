# Nenufar Analytics & Optimization System
Version: v1.1

## Problem Statement
"How can we identify and capitalize on high-performing content within the 7-day marketing strategy to maximize community growth?"

## Solution: Multi-Layer Analytics Engine
A data-driven feedback loop that monitors engagement, detects viral patterns, and automatically suggests calendar optimizations to Luna.

---

## 1. Data Layer: Engagement Tracking
The system monitors posts for 48 hours using the `post_engagement` table in Supabase.

### Metrics Collected (Per Platform)
- **Direct Metrics:** Likes, Comments, Shares, Saves, Views, Clicks.
- **Calculated KPIs:** 
    - **Engagement Rate:** (Likes + Comments + Shares) / Views.
    - **Viral Coefficient:** Shares / Likes.
- **Contextual Data:** Day of week, Publish time, Caption style (Poetic vs. Educational), Hashtag density.

---

## 2. Intelligence Layer: Performance Analysis
An autonomous engine that analyzes historical data to detect success patterns.

### Pattern Detection (The "Success DNA")
- **Best Time-Slot:** Identifies the peak hour for each segment (e.g., 7:00 PM for Conservative Women).
- **Style Affinity:** Detects if "Poetic" captions outperform "Educational" ones for specific jewelry pieces.
- **Hashtag Synergy:** Identifies the most effective combinations of Brand vs. Niche tags.

---

## 3. Automation Layer: Optimization Triggers
Real-time actions triggered by specific performance thresholds.

### 🔥 Trigger 1: Viral Amplification
- **Condition:** Engagement rate > 2x the 30-day average.
- **Action:** Luna notifies the user via Telegram: "Viral content detected! Should we replicate this style next week?"

### ⚠️ Trigger 2: Underperformance Alert
- **Condition:** Engagement rate < 0.5x average after 6 hours.
- **Action:** Suggests a hashtag refresh or a different posting time for similar future content.

### 🔄 Trigger 3: Continuous Learning
- **Action:** Weekly update of the `smart_content_calendar` based on the previous month's winners.

---

## 4. Implementation in n8n
1. **Polling Workflow (Every 30m):** Fetches recent post IDs from Meta API and upserts data into Supabase.
2. **Analysis Workflow (Weekly):** Runs SQL aggregations and generates a "Weekly Growth Report" for the user.
3. **Smart Calendar (Autonomous):** Suggests topic shifts (e.g., "Switching Wednesday from Technical to Storytelling based on high demand").

---

## Success Criteria
- [x] Automated detection of viral posts within 2 hours of publishing.
- [x] Weekly optimization report sent to Telegram.
- [x] Clear classification of "Performance Tiers" (Low, Medium, High, Viral) in Supabase.
