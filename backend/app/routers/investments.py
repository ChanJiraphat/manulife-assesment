from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.InvestmentResponse])
def get_user_investments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id
    ).all()
    
    # Calculate additional fields for each investment
    investment_responses = []
    for investment in investments:
        current_value = investment.quantity * investment.current_price
        total_invested = investment.quantity * investment.average_purchase_price
        total_gain_loss = current_value - total_invested
        gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
        
        investment_data = schemas.InvestmentResponse(
            id=investment.id,
            user_id=investment.user_id,
            symbol=investment.symbol,
            name=investment.name,
            asset_type=investment.asset_type,
            quantity=investment.quantity,
            average_purchase_price=investment.average_purchase_price,
            current_price=investment.current_price,
            created_at=investment.created_at,
            updated_at=investment.updated_at,
            current_value=current_value,
            total_gain_loss=total_gain_loss,
            gain_loss_percentage=gain_loss_percentage
        )
        investment_responses.append(investment_data)
    
    return investment_responses

@router.post("/", response_model=schemas.InvestmentResponse)
def create_investment(
    investment: schemas.InvestmentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if investment already exists for this user
    existing_investment = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id,
        models.Investment.symbol == investment.symbol.upper()
    ).first()
    
    if existing_investment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment with this symbol already exists"
        )
    
    db_investment = models.Investment(
        user_id=current_user.id,
        symbol=investment.symbol.upper(),
        name=investment.name,
        asset_type=investment.asset_type,
        quantity=investment.quantity,
        average_purchase_price=investment.purchase_price,
        current_price=investment.purchase_price  # Initially set to purchase price
    )
    
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    
    # Create initial buy transaction
    transaction = models.Transaction(
        user_id=current_user.id,
        investment_id=db_investment.id,
        transaction_type=models.TransactionType.BUY,
        quantity=investment.quantity,
        price_per_unit=investment.purchase_price,
        total_amount=investment.quantity * investment.purchase_price
    )
    
    db.add(transaction)
    db.commit()
    
    # Calculate response fields
    current_value = db_investment.quantity * db_investment.current_price
    total_invested = db_investment.quantity * db_investment.average_purchase_price
    total_gain_loss = current_value - total_invested
    gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
    
    return schemas.InvestmentResponse(
        id=db_investment.id,
        user_id=db_investment.user_id,
        symbol=db_investment.symbol,
        name=db_investment.name,
        asset_type=db_investment.asset_type,
        quantity=db_investment.quantity,
        average_purchase_price=db_investment.average_purchase_price,
        current_price=db_investment.current_price,
        created_at=db_investment.created_at,
        updated_at=db_investment.updated_at,
        current_value=current_value,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage
    )

@router.get("/{investment_id}", response_model=schemas.InvestmentResponse)
def get_investment(
    investment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(models.Investment).filter(
        models.Investment.id == investment_id,
        models.Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Calculate additional fields
    current_value = investment.quantity * investment.current_price
    total_invested = investment.quantity * investment.average_purchase_price
    total_gain_loss = current_value - total_invested
    gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
    
    return schemas.InvestmentResponse(
        id=investment.id,
        user_id=investment.user_id,
        symbol=investment.symbol,
        name=investment.name,
        asset_type=investment.asset_type,
        quantity=investment.quantity,
        average_purchase_price=investment.average_purchase_price,
        current_price=investment.current_price,
        created_at=investment.created_at,
        updated_at=investment.updated_at,
        current_value=current_value,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage
    )

@router.put("/{investment_id}", response_model=schemas.InvestmentResponse)
def update_investment(
    investment_id: int,
    investment_update: schemas.InvestmentUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(models.Investment).filter(
        models.Investment.id == investment_id,
        models.Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Update fields that are provided
    update_data = investment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "symbol" and value:
            value = value.upper()
        setattr(investment, field, value)
    
    db.commit()
    db.refresh(investment)
    
    # Calculate additional fields
    current_value = investment.quantity * investment.current_price
    total_invested = investment.quantity * investment.average_purchase_price
    total_gain_loss = current_value - total_invested
    gain_loss_percentage = (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
    
    return schemas.InvestmentResponse(
        id=investment.id,
        user_id=investment.user_id,
        symbol=investment.symbol,
        name=investment.name,
        asset_type=investment.asset_type,
        quantity=investment.quantity,
        average_purchase_price=investment.average_purchase_price,
        current_price=investment.current_price,
        created_at=investment.created_at,
        updated_at=investment.updated_at,
        current_value=current_value,
        total_gain_loss=total_gain_loss,
        gain_loss_percentage=gain_loss_percentage
    )

@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    investment = db.query(models.Investment).filter(
        models.Investment.id == investment_id,
        models.Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Delete associated transactions first
    db.query(models.Transaction).filter(
        models.Transaction.investment_id == investment_id
    ).delete()
    
    # Delete the investment
    db.delete(investment)
    db.commit()
    
    return {"message": "Investment deleted successfully"}
