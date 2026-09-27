import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session

from app.models.dataset import Workspace, Dataset, Dashboard, DashboardItem
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardItemCreate,
    DashboardItemUpdate,
)

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def create_dashboard(self, workspace_id: str, data: DashboardCreate) -> Dashboard:
        """
        Creates a new dashboard in the specified workspace.
        """
        workspace = self.db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            # Fallback to creating or getting default workspace
            workspace = Workspace(id=workspace_id, name="Default Workspace")
            self.db.add(workspace)
            self.db.commit()
            self.db.refresh(workspace)

        dashboard = Dashboard(
            workspace_id=workspace_id,
            name=data.name,
            description=data.description,
            filters=data.filters or {},
            status="active"
        )
        self.db.add(dashboard)
        self.db.flush()

        # Add initial dashboard items
        if data.items:
            for item_spec in data.items:
                if item_spec.dataset_id:
                    ds = self.db.query(Dataset).filter(
                        Dataset.id == item_spec.dataset_id,
                        Dataset.workspace_id == workspace_id
                    ).first()
                    if not ds:
                        raise KeyError(f"Dataset '{item_spec.dataset_id}' not found in workspace '{workspace_id}'.")

                item = DashboardItem(
                    dashboard_id=dashboard.id,
                    title=item_spec.title,
                    visualization_spec=item_spec.visualization_spec.model_dump(),
                    dataset_id=item_spec.dataset_id,
                    layout=item_spec.layout.model_dump()
                )
                self.db.add(item)

        self.db.commit()
        self.db.refresh(dashboard)
        return dashboard

    def list_dashboards(self, workspace_id: str) -> List[Dashboard]:
        """
        Lists all active dashboards belonging to the workspace.
        """
        return self.db.query(Dashboard).filter(
            Dashboard.workspace_id == workspace_id,
            Dashboard.status == "active"
        ).order_by(Dashboard.created_at.desc()).all()

    def get_dashboard(self, dashboard_id: str, workspace_id: str) -> Dashboard:
        """
        Retrieves a single dashboard by ID with strict workspace isolation.
        """
        dashboard = self.db.query(Dashboard).filter(
            Dashboard.id == dashboard_id,
            Dashboard.workspace_id == workspace_id
        ).first()

        if not dashboard:
            raise KeyError(f"Dashboard '{dashboard_id}' not found in workspace '{workspace_id}'.")
        return dashboard

    def update_dashboard(self, dashboard_id: str, workspace_id: str, data: DashboardUpdate) -> Dashboard:
        """
        Updates dashboard metadata, filters, and items/layout.
        """
        dashboard = self.get_dashboard(dashboard_id, workspace_id)

        if data.name is not None:
            dashboard.name = data.name
        if data.description is not None:
            dashboard.description = data.description
        if data.filters is not None:
            dashboard.filters = data.filters

        if data.items is not None:
            from app.services.analytics_service import AnalyticsService
            analytics_svc = AnalyticsService(self.db)
            for item_spec in data.items:
                if item_spec.dataset_id:
                    ds = self.db.query(Dataset).filter(
                        Dataset.id == item_spec.dataset_id,
                        Dataset.workspace_id == workspace_id
                    ).first()
                    if not ds:
                        raise KeyError(f"Dataset '{item_spec.dataset_id}' not found in workspace '{workspace_id}'.")

                val_res = analytics_svc.validate_visualization_spec(
                    item_spec.visualization_spec,
                    dataset_id=item_spec.dataset_id
                )
                if not val_res.is_valid:
                    raise ValueError(f"Invalid visualization specification for item '{item_spec.title}': {'; '.join(val_res.issues)}")

            # Re-create dashboard items
            self.db.query(DashboardItem).filter(DashboardItem.dashboard_id == dashboard.id).delete()
            for item_spec in data.items:
                item = DashboardItem(
                    dashboard_id=dashboard.id,
                    title=item_spec.title,
                    visualization_spec=item_spec.visualization_spec.model_dump(),
                    dataset_id=item_spec.dataset_id,
                    layout=item_spec.layout.model_dump()
                )
                self.db.add(item)

        self.db.commit()
        self.db.refresh(dashboard)
        return dashboard

    def delete_dashboard(self, dashboard_id: str, workspace_id: str) -> bool:
        """
        Deletes a dashboard metadata record and its widget layouts.
        Does NOT delete datasets, versions, models, or raw storage files.
        """
        dashboard = self.get_dashboard(dashboard_id, workspace_id)
        self.db.delete(dashboard)
        self.db.commit()
        return True

    def add_item_to_dashboard(
        self,
        dashboard_id: str,
        workspace_id: str,
        item_data: DashboardItemCreate
    ) -> DashboardItem:
        """
        Adds a single visualization item to an existing dashboard.
        """
        dashboard = self.get_dashboard(dashboard_id, workspace_id)

        if item_data.dataset_id:
            ds = self.db.query(Dataset).filter(
                Dataset.id == item_data.dataset_id,
                Dataset.workspace_id == workspace_id
            ).first()
            if not ds:
                raise KeyError(f"Dataset '{item_data.dataset_id}' not found in workspace '{workspace_id}'.")

        # Validate visualization spec & aggregations
        from app.services.analytics_service import AnalyticsService
        analytics_svc = AnalyticsService(self.db)
        val_res = analytics_svc.validate_visualization_spec(
            item_data.visualization_spec,
            dataset_id=item_data.dataset_id
        )
        if not val_res.is_valid:
            raise ValueError(f"Invalid visualization specification: {'; '.join(val_res.issues)}")

        item = DashboardItem(
            dashboard_id=dashboard.id,
            title=item_data.title,
            visualization_spec=item_data.visualization_spec.model_dump(),
            dataset_id=item_data.dataset_id,
            layout=item_data.layout.model_dump()
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_dashboard_item(self, dashboard_id: str, item_id: str, workspace_id: str) -> bool:
        """
        Removes a single widget item from a dashboard.
        Does NOT delete the underlying dataset or visualization spec.
        """
        dashboard = self.get_dashboard(dashboard_id, workspace_id)
        item = self.db.query(DashboardItem).filter(
            DashboardItem.id == item_id,
            DashboardItem.dashboard_id == dashboard.id
        ).first()

        if not item:
            raise KeyError(f"Dashboard item '{item_id}' not found in dashboard '{dashboard_id}'.")

        self.db.delete(item)
        self.db.commit()
        return True
