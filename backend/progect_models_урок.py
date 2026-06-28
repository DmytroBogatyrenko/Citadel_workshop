from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import bcrypt
from enum import Enum
from sqlalchemy import Enum as SQLEnum

# DATABASE_URL = "mysql+aiomysql://root:password@localhost/dbname"
DATABASE_URL = "sqlite+aiosqlite:///./test.db"
# DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"


engine = create_async_engine(DATABASE_URL, echo=True)
# async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False) # старий спосіб, тепер рекомендується використовувати async_sessionmaker для кращої підтримки типів
async_session = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


# Base = declarative_base() # old way, now we use DeclarativeBase for better typing support
class Base(DeclarativeBase):
    pass


# Enum for problem status
class ProblemStatus(str, Enum):
    NEW = "Новий"
    IN_PROGRESS = "В процесі"
    DONE = "Виконаний"


class Problem(Base):
    __tablename__ = "problems"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250))
    description: Mapped[str] = mapped_column(String(1000))
    date_created: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    status:  Mapped[ProblemStatus] = mapped_column(
        SQLEnum(ProblemStatus, native_enum=False), # native_enum=False збереже як рядок, але з валідацією
        default=ProblemStatus.NEW,
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    admin_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )  # адміністратор, що взяв у роботу

    user = relationship("User", foreign_keys=[user_id], back_populates="problems")
    admin = relationship(
        "User", foreign_keys=[admin_id], back_populates="assigned_problems"
    )

    response = relationship("AdminResponse", back_populates="problem", uselist=False)
    service_record = relationship(
        "ServiceRecord", back_populates="problem", uselist=False
    )


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    problems = relationship(
        "Problem", foreign_keys=[Problem.user_id], back_populates="user"
    )
    assigned_problems = relationship(
        "Problem", foreign_keys=[Problem.admin_id], back_populates="admin"
    )
    responses = relationship("AdminResponse", back_populates="admin")

    def set_password(self, raw_password: str):
        hashed = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt())
        self.password = hashed.decode("utf-8")  # зберігаємо як str

    def verify_password(self, raw_password: str) -> bool:
        return bcrypt.checkpw(
            raw_password.encode("utf-8"), self.password.encode("utf-8")
        )


class AdminResponse(Base):
    __tablename__ = "admin_responses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message: Mapped[str] = mapped_column(String(1000))
    date_responded: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    admin_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("problems.id"), index=True)

    admin = relationship("User", back_populates="responses")
    problem = relationship("Problem", back_populates="response")


class ServiceRecord(Base):
    __tablename__ = "service_records"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_done: Mapped[str] = mapped_column(String(1000))
    date_completed: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    parts_used: Mapped[str] = mapped_column(
        String(1000), nullable=True
    )  # можеш пізніше зробити окрему таблицю
    warranty_info: Mapped[str] = mapped_column(String(1000))

    problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("problems.id"), index=True)

    problem = relationship("Problem", back_populates="service_record")