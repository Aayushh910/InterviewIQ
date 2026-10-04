"""
API Endpoints for Phase 10: Groq Interview Agent & Tool Orchestrator.
Exposes secure orchestration endpoints for the frontend interview flow.
"""

import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.agents.interview import (
    interview_agent,
    AgentTurnRequest,
    AgentTurnResponse,
    AgentSecurityError,
    AgentExecutionError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/orchestrate", response_model=AgentTurnResponse, status_code=status.HTTP_200_OK)
def orchestrate_interview_turn(
    request: AgentTurnRequest,
    provider_override: Optional[str] = Query(default=None, description="Override AI provider (groq, mock)"),
    mock_mode: Optional[str] = Query(default=None, description="Mock mode configuration for tests"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Primary orchestration endpoint for the Groq Interview Agent.
    Reasons over session state, invokes appropriate tools via the Tool Registry,
    and returns a structured decision for what happens next.
    """
    try:
        response = interview_agent.orchestrate_turn(
            db=db,
            user_id=str(current_user.id),
            request=request,
            provider_override=provider_override,
            mock_mode=mock_mode,
        )
        return response
    except AgentSecurityError as e:
        logger.warning(f"Security error during agent orchestration: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except AgentExecutionError as e:
        logger.error(f"Execution error during agent orchestration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while orchestrating the interview turn."
        )
    except Exception as e:
        logger.error(f"Unexpected error in agent orchestration endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during interview orchestration."
        )


@router.get("/capabilities", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def get_agent_capabilities(
    current_user: User = Depends(get_current_user),
):
    """
    Return operational agent capabilities, exposed tools, and orchestration constraints.
    """
    exposed = interview_agent.get_exposed_tools()
    tool_names = [t.get("function", {}).get("name") for t in exposed]

    return {
        "agent_name": "InterviewIQ Groq Interview Agent",
        "version": "1.0.0",
        "provider": "Groq",
        "default_model": "llama-3.3-70b-versatile",
        "hard_iteration_limit": 4,
        "operational_tools_count": len(exposed),
        "operational_tools": tool_names,
        "future_contracts_exposed": False,
    }
