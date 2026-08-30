from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.order import Order
from app.routers.auth import get_current_user
from app.schemas.auth import AdminRead, UserStatusUpdate
from app.services.audit import log_audit_event

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify that the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user


@router.get("/me", response_model=AdminRead)
def get_admin_info(current_admin: User = Depends(get_current_admin)) -> User:
    """Get current admin info"""
    return current_admin


@router.get("/stats")
def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> dict:
    """Get dashboard statistics"""
    # Total users
    total_users = db.scalar(select(func.count(User.id)))
    
    # Total orders
    total_orders = db.scalar(select(func.count(Order.id)))
    
    # Paid orders
    paid_orders = db.scalar(
        select(func.count(Order.id)).where(Order.payment_status == "PAID")
    )
    
    # Failed payments
    failed_payments = db.scalar(
        select(func.count(Order.id)).where(Order.payment_status == "PAYMENT_FAILED")
    )
    
    # Pending payments
    pending_payments = db.scalar(
        select(func.count(Order.id)).where(Order.payment_status == "PAYMENT_PENDING")
    )
    
    # Recent audit logs
    recent_logs = db.scalars(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(4)
    ).all()
    
    return {
        "total_users": total_users or 0,
        "total_orders": total_orders or 0,
        "paid_orders": paid_orders or 0,
        "failed_payments": failed_payments or 0,
        "pending_payments": pending_payments or 0,
        "recent_activity": [
            {
                "id": log.id,
                "action": log.action,
                "description": log.description,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in recent_logs
        ]
    }


@router.get("/audit-logs")
def get_audit_logs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    action: str | None = None,
) -> dict:
    """Get paginated audit logs with optional filtering"""
    if page < 1 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid page or limit parameters"
        )
    
    # Build query
    query = select(AuditLog)
    
    if action and action != "all":
        query = query.where(AuditLog.action == action)
    
    # Get total count
    total = db.scalar(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.action == action if action and action != "all" else True
        )
    )
    
    # Paginate
    offset = (page - 1) * limit
    logs = db.scalars(
        query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    ).all()
    
    total_pages = (total + limit - 1) // limit if total else 1
    
    return {
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "description": log.description,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    }


@router.get("/users")
def get_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
) -> dict:
    """Get paginated list of users with optional search"""
    if page < 1 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid page or limit parameters"
        )
    
    # Build query
    query = select(User)
    
    # Add search filter
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term),
                User.name.ilike(search_term),
            )
        )
    
    # Get total count
    total = db.scalar(
        select(func.count()).select_from(User).where(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
            ) if search else True
        )
    )
    
    # Paginate
    offset = (page - 1) * limit
    users = db.scalars(
        query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    ).all()
    
    total_pages = (total + limit - 1) // limit if total else 1
    
    # Get order statistics for each user
    user_items = []
    for user in users:
        total_orders = db.scalar(
            select(func.count(Order.id)).where(Order.user_id == user.id)
        ) or 0
        
        paid_orders = db.scalar(
            select(func.count(Order.id)).where(
                (Order.user_id == user.id) & (Order.payment_status == "PAID")
            )
        ) or 0
        
        pending_orders = db.scalar(
            select(func.count(Order.id)).where(
                (Order.user_id == user.id) & (Order.payment_status == "PAYMENT_PENDING")
            )
        ) or 0
        
        failed_orders = db.scalar(
            select(func.count(Order.id)).where(
                (Order.user_id == user.id) & (Order.payment_status == "PAYMENT_FAILED")
            )
        ) or 0
        
        total_spent = db.scalar(
            select(func.sum(Order.amount)).where(
                (Order.user_id == user.id) & (Order.payment_status == "PAID")
            )
        ) or 0
        
        user_items.append({
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "pending_orders": pending_orders,
            "failed_orders": failed_orders,
            "total_spent": float(total_spent),
        })
    
    return {
        "items": user_items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Update user's active status"""
    is_active = status_update.is_active
    
    # Prevent admin from disabling themselves
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own admin account"
        )
    
    # Find user
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update status
    old_status = user.is_active
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
    # Log the action
    action = "ADMIN_USER_ENABLED" if is_active else "ADMIN_USER_DISABLED"
    status_text = "enabled" if is_active else "disabled"
    
    try:
        log_audit_event(
            db=db,
            user_id=current_admin.id,
            action=action,
            description=f"Administrator {status_text} user {user.username}",
            resource_type="USER",
            resource_id=user.id,
        )
    except Exception as e:
        print(f"Failed to log audit event: {e}")
    
    return {
        "status": "success",
        "message": f"User {user.username} has been {status_text}",
        "user_id": user.id,
        "is_active": user.is_active,
    }



@router.get("/analytics/revenue")
def get_revenue_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    days: int = 7,
) -> dict:
    """Get revenue generated for the last N days"""
    from datetime import date, timedelta
    
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days must be between 1 and 365"
        )
    
    # Get today's date (at midnight UTC)
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)
    
    # Initialize revenue dict for all days (starting with 0)
    revenue_by_day = {}
    for i in range(days):
        current_day = start_date + timedelta(days=i)
        revenue_by_day[current_day] = 0
    
    # Query paid orders from the last N days
    orders = db.scalars(
        select(Order).where(
            (Order.payment_status == "PAID") &
            (Order.payment_at >= datetime.combine(start_date, datetime.min.time())) &
            (Order.payment_at <= datetime.combine(today, datetime.max.time()))
        )
    ).all()
    
    # Aggregate revenue by payment date
    for order in orders:
        if order.payment_at:
            payment_date = order.payment_at.date()
            if payment_date in revenue_by_day:
                revenue_by_day[payment_date] += order.amount or 0
    
    # Build response
    revenue_data = []
    for day in sorted(revenue_by_day.keys()):
        revenue_data.append({
            "date": day.isoformat(),
            "revenue": revenue_by_day[day],
        })
    
    return {
        "days": revenue_data,
        "total_days": days,
    }
