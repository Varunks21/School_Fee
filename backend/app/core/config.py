import os


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_zE4lGsCKHym9@ep-green-snow-a7sf3zr2-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    )


settings = Settings()
