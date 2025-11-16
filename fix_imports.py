import os
import glob

# Fix all Python files in backend
for filepath in glob.glob('c:\\xampp\\htdocs\\OnlineBusTrackingSystem\\backend/**/*.py', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the import
    new_content = content.replace('from backend.app import db', 'from backend.database import db')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {filepath}")

print("✓ Done")
