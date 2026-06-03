import sqlite3
conn = sqlite3.connect('backend/database.db')
cur = conn.cursor()
cur.execute("UPDATE tenant SET rent_status='overdue' WHERE id=22")
conn.commit()
cur.execute("SELECT id, name, rent_status FROM tenant WHERE id=22")
print("Updated:", cur.fetchone())
conn.close()
