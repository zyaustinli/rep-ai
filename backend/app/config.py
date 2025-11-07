from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator


class Settings(BaseSettings):
    # Environment
    environment: str = "development"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # CORS
    cors_origins: Union[List[str], str] = ["http://localhost:3000"]

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str

    # AI APIs (optional for now)
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""  # For audio analysis

    # Vapi Voice AI
    vapi_api_key: str = ""  # Private key for server-side SDK
    vapi_public_key: str = ""  # Public key for frontend
    vapi_webhook_secret: str = ""  # Secret for webhook signature verification

    # Backend URL for webhooks
    backend_url: str = "http://localhost:8000"  # Default for local development

    # ChromaDB / RAG Settings
    chroma_persist_directory: str = "./chroma_data"  # Directory to persist vector data
    rag_top_k: int = 5  # Number of chunks to retrieve in RAG queries
    rag_classifier_confidence_threshold: float = 0.7  # Minimum confidence to trigger RAG

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env that aren't defined in Settings


settings = Settings()
