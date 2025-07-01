from langchain_core.tools import tool
from .math_utils import solve_equation_with_sympy

@tool
def evaluate_equation(equation: str):
    """Evaluates a mathematical equation.

    Args:
        equation (str): The equation to evaluate.

    Returns:
        str: The result of the evaluation.
    """
    return solve_equation_with_sympy(equation)

@tool
def get_equation_step_by_step(equation: str):
    """Provides a step-by-step solution for a mathematical equation.

    Args:
        equation (str): The equation to solve.

    Returns:
        str: A step-by-step solution for the equation.
    """
    solution = solve_equation_with_sympy(equation)
    # In a real scenario, sympy might provide more detailed steps.
    # For now, we'll simulate steps and rely on LLM for natural language explanation.
    return f"Para resolver a equação {equation}, siga estes passos: Primeiro, simplifique ambos os lados. Em seguida, isole a variável 'x'. A solução final é x = {solution[0] if solution else 'N/A'}."

@tool
def show_the_solution(equation: str):
    """Provides the final solution for a mathematical equation.

    Args:
        equation (str): The equation to solve.

    Returns:
        str: The final solution for the equation.
    """
    solution = solve_equation_with_sympy(equation)
    return f"A solução para a equação {equation} é x = {solution[0] if solution else 'N/A'}."