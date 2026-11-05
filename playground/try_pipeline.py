import sys
from pathlib import Path

import nest_asyncio

sys.path.append(str(Path(__file__).resolve().parents[1]))

nest_asyncio.apply()
from app.ai.decide import decide

question = "hello, Can you help me to automate some of my tasks? I want to create a workflow that automatically sends a follow-up email to my clients after they make a purchase. The email should thank them for their purchase, provide them with a discount code for their next purchase, and ask for feedback on their experience. Can you help me with this?"
decision = decide(question)
print(decision.model_dump_json(indent=2))
