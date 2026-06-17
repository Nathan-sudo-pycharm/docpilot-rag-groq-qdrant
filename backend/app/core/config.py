from pydantic_settings import BaseSettings

# BaseSettings reads values from environment variables automatically.
# If GROQ_API_KEY is set in your .env file, it shows up here as
# settings.groq_api_key — no manual os.environ.get() needed.
#
# Why use this instead of os.environ.get() directly?
# Because pydantic validates types and required fields.
# If GROQ_API_KEY is missing, the app crashes immediately at startup
# with a clear error message — not silently later when you try to use it.

class Settings(BaseSettings):
    groq_api_key: str
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "support_docs"
    embedding_model: str = "nomic-ai/nomic-embed-text-v1.5"

    class Config:
        env_file = ".env"

# Create one instance. Import `settings` anywhere you need config values.
settings = Settings()