import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("SELECT id, name, role, email, phone, property_id, property_name FROM staff")
print("Staff table:")
for row in cur.fetchall():
    print(row)
conn.close()
