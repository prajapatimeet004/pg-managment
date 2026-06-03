import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("SELECT id, name, rent_status, rent_due_date FROM tenant WHERE name LIKE '%lal%'")
print(cur.fetchall())
conn.close()
