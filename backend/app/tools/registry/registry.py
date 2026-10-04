import time
import logging
from typing import Dict, List, Any, Union
from pydantic import BaseModel

from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import (
    ToolError,
    ToolNotFoundError,
    ToolDuplicateRegistrationError,
    ToolValidationError,
)

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Centralized Tool Registry for discovery, validation, and execution of InterviewIQ tools.
    Provides tool definitions to future LLM agents and orchestrates isolated tool executions.
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """
        Register a tool instance. Enforces unique names.
        """
        if not tool or not getattr(tool, "name", None):
            raise ValueError("Tool instance must define a valid non-empty 'name'.")

        name = tool.name.strip()
        if name in self._tools:
            raise ToolDuplicateRegistrationError(f"Tool '{name}' is already registered in registry.")

        self._tools[name] = tool
        logger.info(f"Registered tool '{name}' (category: {tool.category})")

    def get(self, name: str) -> BaseTool:
        """
        Retrieve a registered tool by its name. Raises ToolNotFoundError if missing.
        """
        clean_name = (name or "").strip()
        if clean_name not in self._tools:
            raise ToolNotFoundError(f"Tool '{clean_name}' is not registered.")
        return self._tools[clean_name]

    def has_tool(self, name: str) -> bool:
        """
        Check if a tool exists in the registry.
        """
        return (name or "").strip() in self._tools

    def list_tools(self) -> List[str]:
        """
        Return the names of all registered tools.
        """
        return sorted(list(self._tools.keys()))

    def list_tool_instances(self) -> List[BaseTool]:
        """
        Return list of all registered BaseTool instances.
        """
        return list(self._tools.values())

    def get_tool_definitions(self, include_future: bool = False) -> List[Dict[str, Any]]:
        """
        Export LLM function calling specifications for registered tools.
        Filters out future contracts unless explicitly requested.
        """
        definitions = []
        for name in sorted(self._tools.keys()):
            tool = self._tools[name]
            if tool.is_future_contract and not include_future:
                continue
            definitions.append(tool.to_tool_definition())
        return definitions

    def execute_tool(
        self,
        name: str,
        context: ToolExecutionContext,
        params: Union[Dict[str, Any], BaseModel]
    ) -> ToolResult:
        """
        Validate input parameters and execute the specified tool with timing and error isolation.
        """
        start_time = time.perf_counter()
        clean_name = (name or "").strip()

        try:
            tool = self.get(clean_name)
        except ToolNotFoundError as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolResult(
                tool_name=clean_name,
                success=False,
                error=str(e),
                execution_time_ms=round(elapsed_ms, 2)
            )

        try:
            validated_params = tool.validate_params(params)
            result = tool.execute(context=context, params=validated_params)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            result.execution_time_ms = round(elapsed_ms, 2)
            return result
        except ToolValidationError as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolResult(
                tool_name=clean_name,
                success=False,
                error=str(e),
                execution_time_ms=round(elapsed_ms, 2)
            )
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"Error executing tool '{clean_name}': {e}", exc_info=True)
            return ToolResult(
                tool_name=clean_name,
                success=False,
                error=f"Tool '{clean_name}' execution failed: {str(e)}",
                execution_time_ms=round(elapsed_ms, 2)
            )

    def clear(self) -> None:
        """
        Clear all registered tools (primarily used for test isolation).
        """
        self._tools.clear()


# Global default registry instance
default_registry = ToolRegistry()


def get_tool_registry() -> ToolRegistry:
    """
    Retrieve the singleton default tool registry.
    """
    return default_registry
