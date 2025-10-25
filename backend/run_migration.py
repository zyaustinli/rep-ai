"""
Script to run database migrations on Supabase
"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def run_migration(migration_file: str):
    """
    Execute a SQL migration file on Supabase
    """
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Read migration file
    migration_path = Path(__file__).parent.parent / "docs" / "migrations" / migration_file

    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        return False

    with open(migration_path, 'r') as f:
        sql = f.read()

    print(f"📄 Running migration: {migration_file}")
    print(f"📝 SQL:\n{sql}\n")

    try:
        # Execute SQL using Supabase RPC
        # Note: Supabase Python client doesn't have direct SQL execution
        # So we'll use the PostgREST API with rpc
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()

        print(f"✅ Migration completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print("\n⚠️  Please run this migration manually in Supabase SQL Editor:")
        print(f"    1. Go to https://app.supabase.com/project/_/sql")
        print(f"    2. Copy and paste the SQL from: {migration_path}")
        print(f"    3. Click 'Run'")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    print(f"📍 Supabase URL: {SUPABASE_URL}")

    # Run the migration
    success = run_migration("001_add_vapi_fields_to_sessions.sql")

    if not success:
        print("\n" + "="*60)
        print("MANUAL MIGRATION REQUIRED")
        print("="*60)
        print("\nPlease execute the following SQL in Supabase SQL Editor:")
        print("(Dashboard → SQL Editor → New Query)\n")

        migration_path = Path(__file__).parent.parent / "docs" / "migrations" / "001_add_vapi_fields_to_sessions.sql"
        with open(migration_path, 'r') as f:
            print(f.read())

        print("\n" + "="*60)
