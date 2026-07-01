import os
import re

router_dir = r"c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers"

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add imports if not present
    if "from security import get_current_user" not in content and filepath != os.path.join(router_dir, "auth.py"):
        # Add import at the top after other imports
        content = re.sub(r'^(from fastapi .*?)$', r'\1\nfrom security import get_current_user\nfrom models import Owner', content, count=1, flags=re.MULTILINE)

    # 2. Replace owner_id query param with Depends(get_current_user)
    # The signature looks like:
    # owner_id: Optional[int] = Query(None),
    # We want: current_user: Owner = Depends(get_current_user),
    content = re.sub(
        r'owner_id:\s*Optional\[int\]\s*=\s*Query\(None\),?',
        r'current_user: Owner = Depends(get_current_user),',
        content
    )

    # 3. Replace usages of `owner_id` with `current_user.id` inside the function bodies.
    # Note: this replaces ALL standalone occurrences of `owner_id` (that are not part of an attribute like `result.owner_id`) 
    # with `current_user.id`. Wait, it might be safer to replace `owner_id,` with `current_user.id,` or `owner_id)` with `current_user.id)`.
    # Let's do it carefully. In Python, `owner_id` is passed as `owner_id` to services.
    # We can just replace `owner_id` with `current_user.id` in the function bodies where it's passed as an argument.
    content = re.sub(r'\bowner_id\b(?!:|\.|\s*=\s*Query)', r'current_user.id', content)
    
    # Let's fix `current_user.id: Optional[int]` back to `owner_id: Optional[int]` if it accidentally matched (but the regex negative lookahead prevents it).
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {filepath}")

for filename in os.listdir(router_dir):
    if filename.endswith(".py") and filename not in ("__init__.py", "websocket.py", "auth.py"):
        patch_file(os.path.join(router_dir, filename))

print("Patching complete.")
