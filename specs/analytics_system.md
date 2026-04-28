# Nenufar Analytics & Optimization System

## Problem Statement
"If a post during the 7-day strategy generates more engagement, how do we capitalize on that?"

## Solution: Multi-Layer Analytics System

### 🎯 Layer 1: Real-Time Engagement Tracking

#### Metrics to Track (Per Platform)
```sql
CREATE TABLE post_engagement (
    id UUID PRIMARY KEY,
    post_id TEXT,                    -- Facebook/Instagram post ID
    platform TEXT,                   -- facebook, instagram
    file_id TEXT REFERENCES processed_files(file_id),
    published_at TIMESTAMP,
    
    -- Engagement Metrics (Updated every hour for 24h, then daily)
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    
    -- Calculated Metrics
    engagement_rate DECIMAL,         -- (likes + comments + shares) / views
    viral_coefficient DECIMAL,       -- shares / likes
    
    -- Context
    day_of_week TEXT,                -- Monday, Tuesday, etc.
    publish_time TIME,
    caption_style TEXT,              -- poetic, educational, social
    hashtag_count INTEGER,
    
    -- Performance Classification
    performance_tier TEXT,           -- low, medium, high, viral
    
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 🔄 Real-Time Updates (Every 30 min)
```sql
-- Function to update engagement metrics
CREATE OR REPLACE FUNCTION update_engagement(
    p_post_id TEXT,
    p_platform TEXT
) RETURNS VOID AS $$
BEGIN
    -- This would be called by n8n workflow polling Graph API
    INSERT INTO engagement_snapshots (post_id, platform, likes_count, comments_count, shares_count, timestamp)
    VALUES (p_post_id, p_platform, 
            (SELECT likes FROM facebook_api WHERE post_id = p_post_id),
            (SELECT comments FROM facebook_api WHERE post_id = p_post_id),
            (SELECT shares FROM facebook_api WHERE post_id = p_post_id),
            NOW())
    ON CONFLICT (post_id, timestamp) 
    DO UPDATE SET 
        likes_count = EXCLUDED.likes_count,
        comments_count = EXCLUDED.comments_count,
        shares_count = EXCLUDED.shares_count;
END;
$$ LANGUAGE plpgsql;
```

### 🧠 Layer 2: Performance Analysis Engine

#### 📈 Pattern Detection
```sql
-- Analyze best performing content by day of week
CREATE TABLE content_performance_insights (
    id UUID PRIMARY KEY,
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Best performing patterns
    best_day_of_week TEXT,           -- "Tuesday: 5.2% avg engagement"
    best_time_range TEXT,            -- "19:00-21:00: 6.1% engagement"
    best_caption_style TEXT,         -- "Poetic: 4.8% vs Educational: 3.2%"
    best_hashtag_combination TEXT[], -- ["#JoyeríaAncestral", "#PoemasTejidos"]
    
    -- Trending content
    viral_threshold DECIMAL,         -- Posts with >2x average engagement
    top_performing_post_id TEXT,
    replication_opportunity TEXT,    -- "Style of post X performed well, replicate"
    
    -- Recommendations
    recommended_action TEXT,
    confidence_score DECIMAL          -- 0-100: How confident is the recommendation?
);

-- Stored procedure to generate insights
CREATE OR REPLACE FUNCTION generate_weekly_insights()
RETURNS TABLE (
    best_day TEXT,
    best_time TEXT,
    best_style TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH engagement_by_day AS (
        SELECT 
            day_of_week,
            AVG(engagement_rate) as avg_engagement,
            COUNT(*) as post_count
        FROM post_engagement
        WHERE published_at > NOW() - INTERVAL '30 days'
        GROUP BY day_of_week
        ORDER BY avg_engagement DESC
        LIMIT 1
    ),
    best_time AS (
        SELECT 
            substring(publish_time::text, 1, 2) || ':00-' || 
            substring(publish_time::text, 1, 2) || ':59' as time_range,
            AVG(engagement_rate) as avg_engagement
        FROM post_engagement
        WHERE published_at > NOW() - INTERVAL '30 days'
        GROUP BY time_range
        ORDER BY avg_engagement DESC
        LIMIT 1
    )
    SELECT 
        d.day_of_week,
        t.time_range,
        'poetic' as best_style,  -- Would be calculated from real data
        'Replicate poetic content on ' || d.day_of_week || ' at ' || t.time_range as recommendation
    FROM engagement_by_day d, best_time t;
END;
$$ LANGUAGE plpgsql;
```

### 🚀 Layer 3: Automated Optimization Actions

#### 📱 Action Triggers Based on Performance

**TRIGGER 1: Viral Content Amplification**
```
IF engagement_rate > 2x average AND published < 24h ago:
    → Send Telegram alert: "🔥 POST VIRAL! Consider promoting"
    → Suggest: Create similar content next week
    → Suggest: Boost with paid ads
    → Auto-schedule similar content for next week
```

**TRIGGER 2: Underperforming Content Rescue**
```
IF engagement_rate < 0.5x average AND published < 6h ago:
    → Send Telegram alert: "Low engagement detected"
    → Suggest: Edit caption or hashtags
    → Suggest: Repost at different time
```

**TRIGGER 3: Trend Detection**
```
IF specific hashtag/style gets 3x+ engagement consistently:
    → Update content calendar: More of this style
    → Alert: "Users love poetic content on Tuesdays"
    → Auto-generate similar captions
```

### 🔄 Layer 4: Learning Content Calendar

#### Smart Calendar Adjustment
```sql
CREATE TABLE smart_content_calendar (
    id UUID PRIMARY KEY,
    scheduled_date DATE,
    
    -- Original 7-day strategy
    planned_theme TEXT,              -- "Tejiendo Caminos"
    planned_style TEXT,              -- "Social stories"
    
    -- AI-optimized adjustments
    optimized_theme TEXT,            -- May change based on performance
    optimized_style TEXT,
    optimization_reason TEXT,         -- "Tuesday poetic content performs 40% better"
    
    -- Performance prediction
    predicted_engagement DECIMAL,
    confidence_interval TEXT,        -- "4.2% ± 0.8%"
    
    -- Actual results
    actual_engagement DECIMAL,
    learning_applied BOOLEAN DEFAULT FALSE
);

-- Function to optimize calendar based on learnings
CREATE OR REPLACE FUNCTION optimize_content_calendar()
RETURNS TABLE (
    original_date DATE,
    original_theme TEXT,
    optimized_theme TEXT,
    improvement_expected TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH top_performing_combos AS (
        SELECT 
            day_of_week,
            caption_style,
            AVG(engagement_rate) as avg_engagement
        FROM post_engagement
        WHERE published_at > NOW() - INTERVAL '30 days'
        GROUP BY day_of_week, caption_style
        ORDER BY avg_engagement DESC
    )
    SELECT 
        scc.scheduled_date,
        scc.planned_theme,
        tpc.caption_style as optimized_style,
        'Expected ' || ROUND((tpc.avg_engagement - 3.5) / 3.5 * 100) || '% improvement' as expected_improvement
    FROM smart_content_calendar scc
    JOIN top_performing_combos tpc ON 
        EXTRACT(DOW FROM scc.scheduled_date) = 
        CASE tpc.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 0
        END
    WHERE scc.scheduled_date > CURRENT_DATE
    ORDER BY scc.scheduled_date
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Implementation in n8n Workflows

### 1. Engagement Polling Workflow (Every 30 min)
```json
{
  "name": "Engagement Polling",
  "trigger": "schedule (30 min)",
  "nodes": [
    {
      "name": "Fetch Recent Posts",
      "type": "supabase",
      "operation": "select posts published < 48h ago"
    },
    {
      "name": "Get Engagement from Graph API",
      "type": "facebook + instagram api",
      "operation": "get insights (likes, comments, shares)"
    },
    {
      "name": "Update Database",
      "type": "supabase",
      "operation": "upsert engagement metrics"
    },
    {
      "name": "Check Triggers",
      "type": "code",
      "operation": "evaluate viral/underperforming triggers"
    },
    {
      "name": "Send Alerts",
      "type": "telegram",
      "operation": "notify user of actionable insights"
    }
  ]
}
```

### 2. Weekly Analysis Workflow (Every Sunday at 10 PM)
```json
{
  "name": "Weekly Performance Analysis",
  "trigger": "schedule (Sunday 22:00)",
  "nodes": [
    {
      "name": "Generate Insights",
      "type": "supabase",
      "operation": "CALL generate_weekly_insights()"
    },
    {
      "name": "Optimize Next Week Calendar",
      "type": "supabase",
      "operation": "CALL optimize_content_calendar()"
    },
    {
      "name": "Create Weekly Report",
      "type": "code",
      "operation": "generate markdown report"
    },
    {
      "name": "Send Report to User",
      "type": "telegram",
      "operation": "send weekly performance summary"
    }
  ]
}
```

## 📈 Example Use Case

### Scenario: Tuesday Poetic Post Goes Viral

**Day 1 (Tuesday):**
```
📤 Post published at 19:30
📊 Content: Poetic caption about blue earrings
🏷️ Hashtags: #PoemasTejidos #JoyeríaAncestral
```

**Day 1 (21:00):**
```
📈 Engagement polling detects:
- 250 likes (vs average 80)
- 45 comments (vs average 12)
- 6.8% engagement rate (vs average 3.2%)
🔥 TRIGGER: Viral content detected!
```

**Day 1 (21:05):**
```
📱 Telegram alert:
"🔥 ¡POST VIRAL DETECTADO!

Post: Poemas Tejidos - Aretes Azules
Engagement: 6.8% (2.1x above average)
Acciones recomendadas:
1. Crear contenido similar el próximo martes
2. Considerar promoción pagada
3. Generar variaciones del caption poético
4. Usar mismos hashtags en futuras publicaciones

¿Quieres que optimice el calendario automáticamente?"
```

**Day 1 (21:10):**
```
👤 User: "Sí, optimizar"
🤖 Luna: "✅ Calendario optimizado:
- Próximo martes: Poemas Tejidos (mismo estilo)
- Miércoles: Variación del caption poético
- Hashtag set actualizado para maximizar alcance"
```

**Day 8 (Following Tuesday):**
```
📤 Similar post published automatically
📊 Results: 5.9% engagement (84% improvement vs baseline)
🎯 Learning confirmed and stored in database
```

## 🔄 Continuous Learning Loop

1. **Collect** engagement data every 30 min
2. **Analyze** patterns weekly and monthly
3. **Recommend** actionable optimizations
4. **Apply** learning automatically with approval
5. **Measure** impact of optimizations
6. **Iterate** and improve recommendations

## 📊 Analytics Dashboard (Optional)

```sql
-- View for real-time performance monitoring
CREATE VIEW engagement_dashboard AS
SELECT 
    DATE(published_at) as date,
    platform,
    COUNT(*) as posts_published,
    AVG(engagement_rate) as avg_engagement,
    SUM(likes_count) as total_likes,
    SUM(comments_count) as total_comments,
    SUM(shares_count) as total_shares
FROM post_engagement
WHERE published_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(published_at), platform
ORDER BY date DESC;
```

## 🎯 Key Benefits

✅ **Real-time optimization** based on actual performance
✅ **Automated learning** from viral content  
✅ **Strategic adjustments** without manual analysis
✅ **Confidence scoring** on recommendations
✅ **Continuous improvement** over time
✅ **Human oversight** on all major changes

## 🔧 Integration with Existing System

- Works with current 7-day content strategy
- Enhances rather than replaces Luna's creative input
- Provides data-driven insights while maintaining brand voice
- Alerts user before making major calendar changes
