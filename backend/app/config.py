from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FinPilot AI API"
    environment: str = "development"
    frontend_origins: str = "http://localhost:5173"
    sec_user_agent: str = ""
    http_timeout_seconds: float = 12.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


settings = Settings()
