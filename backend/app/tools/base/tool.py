from abc import ABC, abstractmethod
from typing import Type, Dict, Any, Union
from pydantic import BaseModel, ValidationError

from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import ToolValidationError


class BaseTool(ABC):
    """
    Abstract Base Class defining the contract for all InterviewIQ tools.
    Provides schema validation, LLM tool definition generation, and execution interface.
    """
    name: str
    description: str
    input_schema: Type[BaseModel]
    output_schema: Type[BaseModel]
    category: str = "general"
    is_future_contract: bool = False

    def validate_params(self, params: Union[Dict[str, Any], BaseModel]) -> BaseModel:
        """
        Validate incoming parameter dict or model against input_schema.
        """
        if isinstance(params, self.input_schema):
            return params
        elif isinstance(params, BaseModel):
            params = params.model_dump()

        try:
            return self.input_schema.model_validate(params)
        except ValidationError as e:
            raise ToolValidationError(f"Invalid parameters for tool '{self.name}': {e.errors()}")
        except Exception as e:
            raise ToolValidationError(f"Malformed input for tool '{self.name}': {str(e)}")

    def to_tool_definition(self) -> Dict[str, Any]:
        """
        Generate LLM function calling specification compatible with Groq / OpenAI tool format.
        """
        schema = self.input_schema.model_json_schema()
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": schema.get("properties", {}),
                    "required": schema.get("required", []),
                },
            },
            "output_schema": self.output_schema.model_json_schema(),
            "category": self.category,
            "is_future_contract": self.is_future_contract,
        }

    @abstractmethod
    def execute(self, context: ToolExecutionContext, params: BaseModel) -> ToolResult:
        """
        Execute tool functionality with validated parameters and execution context.
        """
        pass
