from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/summary", response_model=schemas.PortfolioSummary)
def get_portfolio_summary(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Get all investments for the user
    investments = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id
    ).all()
    
    total_value = 0.0
    total_invested = 0.0
    
    for investment in investments:
        current_value = investment.quantity * investment.current_price
        invested_value = investment.quantity * investment.average_purchase_price
        total_value += current_value
        total_invested += invested_value
    
    total_gain_loss = total_value - total_invested
    gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
    
    # Count investments and transactions
    investments_count = len(investments)
    transactions_count = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).count()
    
    return schemas.PortfolioSummary(
        total_value=total_value,
        total_invested=total_invested,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage,
        investments_count=investments_count,
        transactions_count=transactions_count
    )
