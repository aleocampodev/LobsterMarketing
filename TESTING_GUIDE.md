# 🧪 Testing Guide - Nenufar Marketing Automation

## 🎯 Objective
Test the complete implementation of:
- **Option A:** Image watermarking
- **Option B:** RAG system with Gemini embeddings

---

## 📋 Prerequisites

### 1. Gemini API Configuration
You already have credentials configured in n8n: **"Google Generative AI"**

### 2. Supabase
- URL: `https://your-project-id.supabase.co`
- Existing credentials: **"Supabase account"**

### 3. Google Drive
- Logo File ID: `1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ`
- Existing credentials: **"Google Drive account"**

---

## 🚀 STEP 1: Setup Supabase Vector Store (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Sidebar → SQL Editor
   - Create a new query

3. **Execute the script**
   ```bash
   # Copy the content of this file:
   scripts/setup-vector-store.sql
   ```
   
4. **Verify creation**
   ```sql
   -- Should return 'brand_knowledge'
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'brand_knowledge';
   
   -- Verify the index
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'brand_knowledge';
   ```

**✅ Checklist Step 1:**
- [ ] Table `brand_knowledge` created
- [ ] Index `brand_knowledge_embedding_idx` created
- [ ] Function `match_brand_knowledge` created
- [ ] Extension `vector` enabled

---

## 🔥 STEP 2: Import Workflows in n8n (3 minutes)

1. **Open n8n**
   - URL: https://n8n-stack-prod-dev.duckdns.org
   - Login with your credentials

2. **Import the workflows**
   ```
   workflows/luna-rag-knowledge-base.json
   workflows/luna-semantic-search.json
   ```

3. **Connect credentials**
   - **Supabase account**: Already exists
   - **Google Generative AI**: Already exists

4. **Configure Gemini API Key**
   - In the "Generate Embeddings" node, replace:
     ```
     YOUR_GEMINI_API_KEY
     ```
   - With your actual Gemini API key
   - Get it at: https://makersuite.google.com/app/apikey

**✅ Checklist Step 2:**
- [ ] Workflows imported correctly
- [ ] Credentials connected
- [ ] Gemini API Key configured

---

## 📊 STEP 3: Create Embeddings (2 minutes)

1. **Open the workflow** "Luna RAG Knowledge Base"

2. **Click on** "Test Workflow" (▶️)

3. **Verify execution**
   - You should see 4 items processed
   - Each item represents a brand document

4. **Confirm in Supabase**
   ```sql
   SELECT id, metadata->>'type' as type, metadata->>'source' as source 
   FROM brand_knowledge;
   ```

   **Expected result:**
   ```
   id                  | type            | source
   --------------------|-----------------|-----------------------
   brand-essence-001   | brand_essence   | specs/brand_essence.md
   soul-001            | soul            | SOUL.md
   product-catalog-001 | product_catalog | specs/product_catalog.md
   social-impact-001   | social_impact   | specs/social_impact.md
   ```

**✅ Checklist Step 3:**
- [ ] 4 embeddings created
- [ ] Records visible in Supabase
- [ ] Embeddings have 768 dimensions

---

## 🔍 STEP 4: Test Semantic Search (3 minutes)

1. **Activate the workflow** "Luna Semantic Search"
   - Toggle ON (top right corner)

2. **Copy the Webhook URL**
   - Click on "Listen for Test Event"
   - Copy the generated URL

3. **Test with curl**
   ```bash
   curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "What is Nenufar\\'s social mission?",
       "top_k": 3
     }'
   ```

4. **Test with Postman** (if you prefer UI)
   - Method: POST
   - URL: [your webhook URL]
   - Headers: Content-Type: application/json
   - Body (raw JSON):
     ```json
     {
       "query": "What words are prohibited in Nenufar?",
       "top_k": 2
     }
     ```

**Expected response:**
```json
{
  "query": "What is Nenufar's social mission?",
  "results": [
    {
      "rank": 1,
      "similarity": 0.95,
      "content": "## Core Mission\nWe train working head-of-household mothers...",
      "metadata": {"type": "social_impact"}
    },
    ...
  ],
  "total_results": 3
}
```

**✅ Checklist Step 4:**
- [ ] Webhook responds correctly
- [ ] Results are relevant
- [ ] Similarity scores are reasonable (> 0.7)

---

## 🖼️ STEP 5: Test Watermark (5 minutes)

1. **Verify the workflow** "Luna Image Processor Worker v2"
   - Should have 7 nodes
   - Must include "Download Nenufar Logo"

2. **Upload a test image**
   - Go to Google Drive
   - Upload an image (e.g., `test-photo.jpg`)
   - Copy the File ID

3. **Send a task to Redis**
   - Use the "Luna Webhook Receiver" workflow or Redis CLI
   - Payload:
     ```json
     {
       "task_id": "test-watermark-001",
       "media_path": "YOUR_FILE_ID_HERE",
       "caption": "Nenufar watermark test",
       "hashtags": ["#Nenufar", "#Test"],
       "platforms": ["instagram"]
     }
     ```

4. **Verify processing**
   ```sql
   -- Check the status
   SELECT file_name, status, watermark_applied, dimensions, error_message 
   FROM processed_files 
   WHERE task_id = 'test-watermark-001'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

5. **Download the processed image**
   - Look for the image in Google Drive (if saved)
   - Or check the output of the "Queue for Social Publisher" node

**✅ Checklist Step 5:**
- [ ] Workflow processes the image
- [ ] Watermark visible (bottom right corner)
- [ ] Correct dimensions (1080x1350 for IG)
- [ ] Status = 'published' in Supabase

---

## 🤖 STEP 6: Integration with Multi-Agent System (Optional)

This step integrates semantic search into the multi-agent system:

1. **Open** "Luna Multi-Agent System v2"

2. **Add an HTTP Request node**
   - Position: After "Set 'Text'" (node cfea44af)
   - Connect before "Google Gemini Chat Model"

3. **Configure the node:**
   - **Method:** POST
   - **URL:** https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search
   - **Body:**
     ```json
     {
       "query": "={{ $json.text }}",
       "top_k": 3
     }
     ```

4. **Update the "Google Gemini Chat Model" node**
   - Add a "System Message" that includes RAG context:
     ```
     Brand context: {{ $json.results }}
     
     You are Luna, Nenufar's digital voice. Use the context above to respond.
     ```

5. **Test via Telegram**
   - Send a message to the Telegram bot
   - Ask about Nenufar's social mission
   - Verify that the response uses semantic search information

**✅ Checklist Step 6:**
- [ ] Semantic search integrated
- [ ] Bot responses are more accurate
- [ ] Brand context used correctly

---

## 🐛 Troubleshooting

### Error: "Function not found"
**Solution:** Execute `scripts/setup-vector-store.sql` in Supabase

### Error: "dimension mismatch"
**Solution:** Verify that embeddings have 768 dimensions (Gemini)
```sql
SELECT array_length(embedding, 1) FROM brand_knowledge LIMIT 1;
```

### Error: "API key not valid"
**Solution:** Replace `YOUR_GEMINI_API_KEY` with your actual API key

### Error: "Watermark not applied"
**Solution:** 
1. Verify that the logo exists in Google Drive
2. Check workflow execution logs
3. Test the "Process Image" node independently

### Search returns irrelevant results
**Solution:**
1. Increase the `top_k` parameter
2. Improve source document quality
3. Verify embeddings were created correctly

---

## 📝 Suggested Test Cases

### Test 1: Social Mission Search
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "What does Nenufar do for mothers?", "top_k": 2}'
```
**Expected:** Document `social-impact-001` at #1

### Test 2: Prohibited Words Search
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "What words should I not use?", "top_k": 2}'
```
**Expected:** Document `brand-essence-001` or `soul-001` at #1

### Test 3: Product Search
```bash
curl -X POST https://n8n-stack-prod-dev.duckdns.org/webhook/luna-semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "What materials do they use?", "top_k": 3}'
```
**Expected:** Document `product-catalog-001` at #1

### Test 4: Instagram Watermark
```json
{
  "task_id": "test-ig-001",
  "media_path": "FILE_ID",
  "caption": "Test",
  "hashtags": ["#test"],
  "platforms": ["instagram"]
}
```
**Expected:** 1080x1350 image with watermark

### Test 5: Facebook Watermark
```json
{
  "task_id": "test-fb-001",
  "media_path": "FILE_ID",
  "caption": "Test",
  "hashtags": ["#test"],
  "platforms": ["facebook"]
}
```
**Expected:** 1080x1080 image with watermark

---

## ✅ Final Checklist

Copy and mark each item:

```
Supabase Setup:
□ brand_knowledge table created
□ Vector index created
□ RPC functions created
□ RLS policies configured

Embeddings:
□ 4 documents embedded
□ 768 dimensions correct
□ Data visible in Supabase

Semantic Search:
□ Webhook responds
□ Relevant results
□ Similarity scores > 0.7
□ 3 test cases pass

Watermark:
□ Workflow has 7 nodes
□ Logo downloaded correctly
□ Image resized
□ Watermark applied
□ IG and FB tests pass

Integration:
□ Multi-Agent System uses RAG
□ Responses improve
□ Brand context preserved
```

---

## 🎉 Congratulations!

If you completed all steps, the system is ready for production.

**Next steps:**
1. Merge PR #2
2. Deploy to production
3. Error monitoring
4. Feedback collection

**Need help?** Check `specs/rag_integration_summary.md` for more technical details.
