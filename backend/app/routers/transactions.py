from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.TransactionResponse])
def get_user_transactions(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    
    # Add investment details to each transaction
    transaction_responses = []
    for transaction in transactions:
        investment = db.query(models.Investment).filter(
            models.Investment.id == transaction.investment_id
        ).first()
        
        transaction_data = schemas.TransactionResponse(
            id=transaction.id,
            user_id=transaction.user_id,
            investment_id=transaction.investment_id,
            transaction_type=transaction.transaction_type,
            quantity=transaction.quantity,
            price_per_unit=transaction.price_per_unit,
            total_amount=transaction.total_amount,
            transaction_date=transaction.transaction_date,
            notes=transaction.notes,
            investment_symbol=investment.symbol if investment else None,
            investment_name=investment.name if investment else None
        )
        transaction_responses.append(transaction_data)
    
    return transaction_responses

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(
    transaction: schemas.TransactionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify investment exists and belongs to user
    investment = db.query(models.Investment).filter(
        models.Investment.id == transaction.investment_id,
        models.Investment.user_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Calculate total amount
    total_amount = transaction.quantity * transaction.price_per_unit
    
    # Create transaction
    db_transaction = models.Transaction(
        user_id=current_user.id,
        investment_id=transaction.investment_id,
        transaction_type=transaction.transaction_type,
        quantity=transaction.quantity,
        price_per_unit=transaction.price_per_unit,
        total_amount=total_amount,
        notes=transaction.notes
    )
    
    db.add(db_transaction)
    
    # Update investment based on transaction type
    if transaction.transaction_type == models.TransactionType.BUY:
        # Calculate new average price and quantity
        total_cost = (investment.quantity * investment.average_purchase_price) + total_amount
        new_quantity = investment.quantity + transaction.quantity
        investment.average_purchase_price = total_cost / new_quantity if new_quantity > 0 else 0
        investment.quantity = new_quantity
    elif transaction.transaction_type == models.TransactionType.SELL:
        # Check if user has enough shares to sell
        if investment.quantity < transaction.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient shares to sell"
            )
        investment.quantity -= transaction.quantity
    
    # Update current price
    investment.current_price = transaction.price_per_unit
    
    db.commit()
    db.refresh(db_transaction)
    
    return schemas.TransactionResponse(
        id=db_transaction.id,
        user_id=db_transaction.user_id,
        investment_id=db_transaction.investment_id,
        transaction_type=db_transaction.transaction_type,
        quantity=db_transaction.quantity,
        price_per_unit=db_transaction.price_per_unit,
        total_amount=db_transaction.total_amount,
        transaction_date=db_transaction.transaction_date,
        notes=db_transaction.notes,
        investment_symbol=investment.symbol,
        investment_name=investment.name
    )

@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    investment = db.query(models.Investment).filter(
        models.Investment.id == transaction.investment_id
    ).first()
    
    return schemas.TransactionResponse(
        id=transaction.id,
        user_id=transaction.user_id,
        investment_id=transaction.investment_id,
        transaction_type=transaction.transaction_type,
        quantity=transaction.quantity,
        price_per_unit=transaction.price_per_unit,
        total_amount=transaction.total_amount,
        transaction_date=transaction.transaction_date,
        notes=transaction.notes,
        investment_symbol=investment.symbol if investment else None,
        investment_name=investment.name if investment else None
    )

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}
