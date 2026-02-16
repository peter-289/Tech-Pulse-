from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepo:
    def __init__(self, db: Session):
        self.db = db

    def add(self, project: Project) -> Project:
        self.db.add(project)
        self.db.flush()
        self.db.refresh(project)
        return project

    def get_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.get(Project, project_id)

    def list_visible_for_user(self, user_id: int, offset: int = 0, limit: int = 50) -> list[Project]:
        stmt = (
            select(Project)
            .where(or_(Project.is_public.is_(True), Project.user_id == user_id))
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def increment_download_count(self, project: Project) -> None:
        project.download_count += 1

    def delete(self, project: Project) -> None:
        self.db.delete(project)

