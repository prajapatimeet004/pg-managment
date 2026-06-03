import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("SELECT id, name, manager, phone, owner_id FROM property")
print("Properties:")
for p in cur.fetchall():
    print(p)

cur.execute("SELECT id, name, property_id, property_name FROM tenant WHERE id=22")
print("Tenant 22:")
print(cur.fetchone())
conn.close()
