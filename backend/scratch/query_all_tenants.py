import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("SELECT tenant.id, tenant.name, tenant.property_id, tenant.property_name, property.manager, property.phone FROM tenant LEFT JOIN property ON tenant.property_id = property.id")
for row in cur.fetchall():
    print(row)
conn.close()
