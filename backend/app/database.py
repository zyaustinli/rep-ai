from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_key
)


def get_supabase() -> Client:
    """
    Dependency to get Supabase client
    """
    return supabase
