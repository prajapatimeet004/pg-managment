import os
import re

router_dir = r"c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\routers"

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find async def create_... or def create_...
    # We want to add current_user: Owner = Depends(get_current_user)
    # and then inside the function block, set obj_in.owner_id = current_user.id
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        if line.lstrip().startswith('async def create_') or line.lstrip().startswith('def create_'):
            # This is a create function.
            # Look for the input variable name, e.g. prop_in: PropertyCreate
            # It might be on the next lines.
            j = i + 1
            input_var = None
            while j < len(lines):
                l = lines[j]
                if ':' in l and 'Depends' not in l and not l.strip().startswith('current_user'):
                    # Likely the input var
                    match = re.search(r'^\s*([a-zA-Z0-9_]+)\s*:', l)
                    if match:
                        input_var = match.group(1)
                
                # Check if we reached the end of the signature
                if "):" in l or ") ->" in l:
                    # Inject current_user if not present
                    if not any('current_user: Owner' in prev_l for prev_l in lines[i:j+1]):
                        # Insert before the closing parenthesis or inside it
                        # For simplicity, we can just replace "):" with ",\n    current_user: Owner = Depends(get_current_user)\n):"
                        lines[j] = l.replace("):", ",\n    current_user: Owner = Depends(get_current_user)\n):")
                    
                    # Next line is the start of the body
                    # Inject input_var.owner_id = current_user.id
                    k = j + 1
                    while k < len(lines) and lines[k].strip() == '':
                        k += 1
                    indent = len(lines[k]) - len(lines[k].lstrip())
                    if input_var:
                        lines.insert(k, " " * indent + f"{input_var}.owner_id = current_user.id")
                    
                    break
                j += 1
        i += 1

    content = '\n'.join(lines)
    
    # Also patch patch_status in complaints which might not be a create but modifies
    # wait, patch_status already takes owner_id from query if it was there.
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched creates in {filepath}")

for filename in os.listdir(router_dir):
    if filename.endswith(".py") and filename not in ("__init__.py", "websocket.py", "auth.py"):
        patch_file(os.path.join(router_dir, filename))

print("Patching creates complete.")
