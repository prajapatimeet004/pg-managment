import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("UPDATE tenant SET rent_status='due' WHERE id=21")
conn.commit()
cur.execute("SELECT id, name, rent_status, rent_due_date FROM tenant WHERE id=21")
print("Updated:", cur.fetchone())
conn.close()
