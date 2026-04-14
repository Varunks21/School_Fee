import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env", override=True)


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip().strip("`").strip('"').strip("'")

    def __init__(self) -> None:
        if not self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env.")


settings = Settings()
