from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str | int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry for an action.
    
    Args:
        db: Database session
        user_id: ID of the user performing the action
        action: Action name (e.g., "USER_LOGIN", "ORDER_CREATED")
        description: Human-readable description
        resource_type: Type of resource affected (e.g., "ORDER")
        resource_id: ID of the resource affected
        ip_address: IP address of the request
        user_agent: User agent string
    
    Returns:
        The created AuditLog record
    """
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        description=description,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log
