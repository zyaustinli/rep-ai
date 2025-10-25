from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Environment
    environment: str = "development"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str

    # AI APIs
    anthropic_api_key: str
    openai_api_key: str

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
