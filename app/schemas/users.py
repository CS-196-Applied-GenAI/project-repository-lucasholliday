"""User response schemas."""

from pydantic import BaseModel


class CurrentUser(BaseModel):
    user_id: int
    username: str
