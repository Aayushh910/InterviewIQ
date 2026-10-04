from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.tools.registry.registry import default_registry
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import ToolNotFoundError

router = APIRouter()


@router.get("", response_model=List[Dict[str, Any]])
def list_available_tools(
    include_future: bool = False,
    current_user: User = Depends(get_current_user),
):
    """
    Discover all registered tools and their function calling schemas for LLM agent integration.
    """
    return default_registry.get_tool_definitions(include_future=include_future)


@router.get("/{tool_name}", response_model=Dict[str, Any])
def get_tool_definition(
    tool_name: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve tool definition and parameter schemas for a specific tool.
    """
    try:
        tool = default_registry.get(tool_name)
        return tool.to_tool_definition()
    except ToolNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{tool_name}/execute", response_model=ToolResult)
def execute_tool(
    tool_name: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Execute a registered tool through the registry with authentication context.
    """
    context = ToolExecutionContext(
        db=db,
        user_id=current_user.id,
    )
    result = default_registry.execute_tool(
        name=tool_name,
        context=context,
        params=payload
    )

    if not result.success and "not registered" in (result.error or "").lower():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.error)

    return result
