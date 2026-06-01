# Root main.py to allow running the backend from the root directory
import sys
import os

# Add the 'backend' folder to sys.path so that its internal absolute imports work
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the app instance from backend.main
from backend.main import app
