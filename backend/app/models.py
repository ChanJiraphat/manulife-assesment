from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class TransactionType(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class AssetType(enum.Enum):
    STOCK = "STOCK"
    BOND = "BOND"
    MUTUAL_FUND = "MUTUAL_FUND"
    ETF = "ETF"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    investments = relationship("Investment", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, index=True, nullable=False)  # e.g., AAPL, GOOGL
    name = Column(String, nullable=False)  # e.g., Apple Inc.
    asset_type = Column(Enum(AssetType, name='assettype'), nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    average_purchase_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="investments")
    transactions = relationship("Transaction", back_populates="investment")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType, name='transactiontype'), nullable=False)
    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    investment = relationship("Investment", back_populates="transactions")
