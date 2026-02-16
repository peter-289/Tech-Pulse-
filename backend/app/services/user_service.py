from app.schemas.user import UserCreate
from app.exceptions.exceptions import ConflictError
from app.core.hashing import hash_password
from app.models.user import User
from app.core.unit_of_work import UnitOfWork

from sqlalchemy.exc import IntegrityError
from app.exceptions.exceptions import NotFoundError


class UserService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow
    
    # Create user
    def create_user(self, payload: UserCreate):
        with self.uow:
            if self.uow.user_repo.get_user_by_username(payload.username):
                raise ConflictError(f"A user with username {payload.username} exists!")
            if self.uow.user_repo.get_user_by_email(payload.email):
                raise ConflictError(f"User with email {payload.email} already exists!")

            # Hash password
            pass_hash = hash_password(payload.password)

            # create user
            user = User(
                full_name=payload.full_name,
                username=payload.username,
                email=payload.email,
                gender=payload.gender,
                password_hash=pass_hash,
            )

            try:
                user = self.uow.user_repo.add_user(user)
            except IntegrityError:
                raise ConflictError("Username or email already exists.")
            return user
        
    # List users
    def list_users(self, offset: int = 0, limit: int = 100) -> list[User]:
        with self.uow:
            return self.uow.user_repo.list_users(offset=offset, limit=limit)

    # Get user by id
    def get_user_by_id(self, user_id: int) -> User:
        with self.uow:
            user = self.uow.user_repo.get_user_by_id(user_id)
            if not user:
                raise NotFoundError("User not found")
            return user
        

        
    
 
