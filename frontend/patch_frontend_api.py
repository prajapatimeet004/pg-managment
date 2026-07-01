import re

api_path = r"c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\frontend\src\app\lib\api.js"

with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ...getHeaders() to all options blocks in fetch
# Find fetch(..., { ... }) and insert ...getHeaders(),
# We can just replace `{ "Content-Type": "application/json" }` with `{ "Content-Type": "application/json", ...getHeaders() }`
# And add `{ headers: getHeaders() }` to fetches without an options object? Wait, fetch(..., { ... }) usually has headers block.
# Let's replace `headers: { "Content-Type": "application/json" }` with `headers: { "Content-Type": "application/json", ...getHeaders() }`
content = content.replace(
    'headers: { "Content-Type": "application/json" }',
    'headers: { "Content-Type": "application/json", ...getHeaders() }'
)

# Replace `method: "DELETE",` with `method: "DELETE", headers: getHeaders(),`
content = content.replace(
    'method: "DELETE",\n        }',
    'method: "DELETE",\n            headers: getHeaders(),\n        }'
)

# For GET requests without options object: `fetch(getUrlWithAuth("/properties"))`
# Change to `fetch(getUrlWithAuth("/properties"), { headers: getHeaders() })`
content = re.sub(
    r'fetch\((getUrlWithAuth\([^)]+\))\)',
    r'fetch(\1, { headers: getHeaders() })',
    content
)

# Also fix `owner_id: getOwnerId()` payload injections, by simply removing it.
# E.g. `body: JSON.stringify({ ...property, owner_id: getOwnerId() })`
# becomes `body: JSON.stringify(property)`
content = re.sub(
    r'body: JSON.stringify\(\{ \.\.\.([a-zA-Z]+), owner_id: getOwnerId\(\) \}\)',
    r'body: JSON.stringify(\1)',
    content
)
# Check for any other forms like `body: JSON.stringify({ message, owner_id: getOwnerId() })`
content = re.sub(
    r'body: JSON.stringify\(\{ message, owner_id: getOwnerId\(\) \}\)',
    r'body: JSON.stringify({ message })',
    content
)
content = re.sub(
    r'body: JSON.stringify\(\{ message, history, owner_id: getOwnerId\(\) \}\)',
    r'body: JSON.stringify({ message, history })',
    content
)


with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("api.js patched.")
