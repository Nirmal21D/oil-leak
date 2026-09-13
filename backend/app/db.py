import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy setup
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def check_db_connection() -> bool:
    """Verifies connection to PostgreSQL and ensures PostGIS extension is available."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();")).fetchone()
            logger.info(f"PostgreSQL Connection Established: {result[0]}")
            
            # Enable/verify PostGIS extension
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            connection.commit()
            
            postgis_ver = connection.execute(text("SELECT PostGIS_Full_Version();")).fetchone()
            logger.info(f"PostGIS Version: {postgis_ver[0]}")
            return True
    except Exception as e:
        logger.warning(f"Database connection / PostGIS check fallback warning: {e}")
        return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Testing PostgreSQL + PostGIS connection...")
    success = check_db_connection()
    if success:
        print("[SUCCESS] PostgreSQL + PostGIS connected!")
    else:
        print("[FALLBACK] Local PostgreSQL database not reachable. Will run in standalone mode.")
