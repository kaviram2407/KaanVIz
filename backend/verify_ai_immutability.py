import os
import hashlib
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.session import Base
from app.services.ingestion_service import CSVIngestionService
from app.services.ai_analyst_service import AIAnalystService
from app.services.ai_provider import MockAIProvider
from app.schemas.analytics import VisualizationSpec

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_raw_immutability():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Create sample raw CSV content
        raw_content = b"category,revenue,units\nElectronics,1200.50,12\nFurniture,850.00,8\nClothing,450.25,15\n"
        
        # 1. Ingest raw dataset
        ingestion = CSVIngestionService(db)
        dataset = ingestion.ingest_csv(
            file_bytes=raw_content,
            original_filename="ai_raw_immutability_test.csv",
            dataset_name="AI Immutability Test Dataset"
        )
        
        # Locate actual physical raw file on disk
        rel_storage_path = dataset.versions[0].storage_location
        abs_raw_path = os.path.abspath(os.path.join("./storage", rel_storage_path))
        
        if not os.path.exists(abs_raw_path):
            abs_raw_path = os.path.abspath(rel_storage_path)
            
        print(f"Physical Raw Storage Path: {abs_raw_path}")
        assert os.path.exists(abs_raw_path), f"Raw file missing at {abs_raw_path}"
        
        # 2. Pre-execution verification
        pre_bytes = open(abs_raw_path, "rb").read()
        pre_size = len(pre_bytes)
        pre_hash = hashlib.sha256(pre_bytes).hexdigest()
        
        print(f"Pre-AI Execution File Size: {pre_size} bytes")
        print(f"Pre-AI Execution SHA-256:   {pre_hash}")
        
        # 3. Perform AI Operations
        with patch.object(settings, "AI_ENABLED", True), patch.object(settings, "AI_PROVIDER", "mock"):
            mock_provider = MockAIProvider()
            ai_service = AIAnalystService(db=db, ai_provider=mock_provider)
            
            # Operation A: Natural Language Question
            nl_resp = ai_service.answer_natural_language_question(
                question="What is total revenue by category?",
                dataset_id=dataset.id
            )
            print(f"AI Operation A (NL Query) returned: {nl_resp.analytics_result.row_count} rows")
            
            # Operation B: Prompt-to-Visual Generation
            vis_resp = ai_service.generate_visualization(
                prompt="Show revenue by category as a bar chart",
                dataset_id=dataset.id
            )
            print(f"AI Operation B (Visual Spec) generated chart type: '{vis_resp.suggestion.chart_type}'")
            
            # Operation C: Explain Visual
            spec = VisualizationSpec(
                chart_type="bar",
                dimensions=[{"field": "category"}],
                measures=[{"field": "revenue", "aggregation": "sum"}]
            )
            exp_resp = ai_service.explain_visual(visual_spec=spec, dataset_id=dataset.id)
            print(f"AI Operation C (Explain Visual) title: '{exp_resp.title}'")
            
            # Operation D: AI Insights
            insights_resp = ai_service.generate_insights(dataset_id=dataset.id)
            print(f"AI Operation D (Insights) generated {len(insights_resp)} insight(s)")
            
        # 4. Post-execution verification
        post_bytes = open(abs_raw_path, "rb").read()
        post_size = len(post_bytes)
        post_hash = hashlib.sha256(post_bytes).hexdigest()
        
        print(f"Post-AI Execution File Size: {post_size} bytes")
        print(f"Post-AI Execution SHA-256:   {post_hash}")
        
        assert pre_size == post_size, "RAW FILE SIZE MUTATED!"
        assert pre_hash == post_hash, "RAW FILE SHA-256 HASH MUTATED!"
        print("\nRAW FILE BYTE-FOR-BYTE IMMUTABILITY VERIFIED 100% SUCCESS!")
        
        # Cleanup created raw test file
        if os.path.exists(abs_raw_path):
            os.remove(abs_raw_path)
        
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

if __name__ == "__main__":
    verify_raw_immutability()
