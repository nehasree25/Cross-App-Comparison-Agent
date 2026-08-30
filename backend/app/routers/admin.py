from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.order import Order
from app.routers.auth import get_current_user
from app.schemas.auth import AdminRead

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
        .limit(10)
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
