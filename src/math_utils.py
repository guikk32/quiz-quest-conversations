import sympy

def solve_equation_with_sympy(equation_str: str):
    try:
        x = sympy.symbols('x')
        # Parsing the equation string to a sympy expression
        # It's important to handle the equation format carefully.
        # Assuming the equation is in the form 'expr1 = expr2'
        if '=' in equation_str:
            lhs_str, rhs_str = equation_str.split('=')
            lhs = sympy.sympify(lhs_str.strip())
            rhs = sympy.sympify(rhs_str.strip())
            equation = sympy.Eq(lhs, rhs)
        else:
            # If no '=' is present, assume the expression is meant to be equal to zero
            equation = sympy.sympify(equation_str)

        # Solving the equation for x
        solution = sympy.solve(equation, x)
        return solution
    except Exception as e:
        return f"Error solving equation: {e}"