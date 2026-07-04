from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    reviewer_name: str = Field(min_length=1, max_length=60)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)


class ReviewItem(BaseModel):
    id: str
    reviewer_name: str
    rating: int
    comment: str
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: list[ReviewItem]
    total: int
    average_rating: float | None
