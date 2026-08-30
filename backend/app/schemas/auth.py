from pydantic import BaseModel, ConfigDict, Field, EmailStr


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    email: EmailStr = Field(description="Valid email address")
    name: str = Field(min_length=1, max_length=255, description="Full name")
    password: str = Field(min_length=8, max_length=256)


class UserLogin(BaseModel):
    username_or_email: str = Field(description="Username or email address")
    password: str = Field(min_length=1, max_length=256)


class AdminLogin(BaseModel):
    username_or_email: str = Field(description="Admin username or email address")
    password: str = Field(min_length=1, max_length=256)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    name: str
    is_active: bool


class AdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    name: str
    is_admin: bool
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminRead


class UserStatusUpdate(BaseModel):
    is_active: bool = Field(description="User active status")
