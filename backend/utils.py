# c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS\backend\utils.py
from datetime import datetime
import calendar

def add_one_month(date_str: str) -> str:
    """Helper to add exactly one month to a YYYY-MM-DD date string."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        month = dt.month
        year = dt.year + (month // 12)
        month = (month % 12) + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        return dt.replace(year=year, month=month, day=day).strftime("%Y-%m-%d")
    except Exception:
        return date_str
