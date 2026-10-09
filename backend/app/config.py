import os

class Settings:
    cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    cache_ttl = int(os.getenv("CACHE_TTL_SECONDS", str(6 * 3600)))

settings = Settings()