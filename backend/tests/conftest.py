import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.api.v1.endpoints.datasets import get_db as get_db_ds
from app.api.v1.endpoints.analytics import get_db as get_db_an
from app.api.v1.endpoints.dashboards import get_db as get_db_db
from app.api.v1.endpoints.ai import get_db as get_db_ai

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db_ds] = override_get_db
app.dependency_overrides[get_db_an] = override_get_db
app.dependency_overrides[get_db_db] = override_get_db
app.dependency_overrides[get_db_ai] = override_get_db



@pytest.fixture
def client():
    return TestClient(app)
