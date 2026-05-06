# Template Selection & Rotation Logic
Version: v1.0

This document defines the algorithm Luna uses to select the most appropriate template from the `nenufar.templates_bank` based on the 7-day strategy and media type.

---

## 1. Context Injection (The "Inputs")
Before selecting a template, the system must identify:
1. **Current Day:** (e.g., Monday).
2. **Current Theme:** From `AGENTS.md` (e.g., Monday = Tejiendo Caminos).
3. **Media Type:** (Reel, Photo, or Story).
4. **History:** Last 7 `template_id` values used (from `nenufar.processed_files`).

---

## 2. Selection Matrix

| Day | Theme | Priority Category | Suggested Template IDs |
|:---|:---|:---|:---|
| **Monday** | Tejiendo Caminos (Social) | Reel / Photo | `reel_artisan_01`, `photo_heritage_01` |
| **Tuesday** | Poemas Tejidos (Storytelling) | Photo | `photo_exclusive_01`, `photo_heritage_01` |
| **Wednesday** | Gajes del Oficio (Process) | Reel | `reel_process_01`, `reel_transformation_01` |
| **Thursday** | Universo Infantil | Photo / Story | `photo_gift_01`, `story_interactive_01` |
| **Friday** | Naturaleza y Espíritu | Photo | `photo_exclusive_01`, `photo_heritage_01` |
| **Saturday** | Cultura en Movimiento | Story | `story_client_love_01`, `photo_local_01` |
| **Sunday** | Reflexión y Color | Question | `post_question_01`, `post_poll_01` |

---

## 3. Rotation Algorithm (Pseudo-code)

```text
FUNCTION select_template(day, media_type, history):
    1. Filter templates_bank WHERE category matches media_type.
    2. Filter results WHERE theme/intent matches "Day Theme".
    3. EXCLUDE template_ids present in "history" (last 7 days).
    4. IF multiple results remain:
        PICK one randomly to ensure variety.
    5. IF NO results remain (Collision):
        PICK the oldest used template from that category.
    6. IF NO templates exist for that media_type:
        ACTIVATE Fallback (Ref: specs/edge_cases.md).
    RETURN selected_template_id
```

---

## 4. Forced Interaction (The "Sunday Seed")
Every Sunday, Luna MUST prompt the user for a "Weekly Seed" via Telegram:
> "🌸 Shirley, ¿qué sentimiento quieres que tejamos esta semana? Cuéntame un poco sobre lo que tienes en mente."

This input is saved in `metadata` and used as an extra variable `{{weekly_seed}}` for the **Content Agent** to refine the poems.
