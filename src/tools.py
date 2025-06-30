from langchain_core.tools import tool
from app import solve_equation_with_sympy

@tool
def evaluate_equation(equation: str):
    """Evaluates a mathematical equation.

    Args:
        equation (str): The equation to evaluate.

    Returns:
        str: The result of the evaluation.
    """
    return solve_equation_with_sympy(equation)