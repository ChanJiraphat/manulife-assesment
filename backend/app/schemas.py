from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class AssetType(str, Enum):
    STOCK = "STOCK"
    BOND = "BOND"
    MUTUAL_FUND = "MUTUAL_FUND"
    ETF = "ETF"

class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# Investment schemas
class InvestmentBase(BaseModel):
    symbol: str
    name: str
    asset_type: AssetType
    quantity: float
    average_purchase_price: float
    current_price: float

class InvestmentCreate(BaseModel):
    symbol: str
    name: str
    asset_type: AssetType
    quantity: float
    purchase_price: float

class InvestmentUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[float] = None
    current_price: Optional[float] = None

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    current_value: Optional[float] = None
    total_gain_loss: Optional[float] = None
    gain_loss_percentage: Optional[float] = None

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    transaction_type: TransactionType
    quantity: float
    price_per_unit: float
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    investment_id: int

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    investment_id: int
    total_amount: float
    transaction_date: datetime
    investment_symbol: Optional[str] = None
    investment_name: Optional[str] = None

    class Config:
        from_attributes = True

# Portfolio summary schema
class PortfolioSummary(BaseModel):
    total_value: float
    total_invested: float
    total_gain_loss: float
    gain_loss_percentage: float
    investments_count: int
    transactions_count: int
