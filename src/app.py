# TODO: Use Case 01: Evaluate a equation and give the step by step solution with a GUI

import asyncio
import multiprocessing
import random
import sympy

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
from llama_cpp import Llama
from dotenv import load_dotenv
import os
from tools import get_equation_step_by_step, show_the_solution

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")
MODEL_NAME = os.getenv("MODEL_NAME")

REWRITE_STEPS_PROMPT = """
Você é um sistema especialista em equações de primeiro grau. Considere os seguintes passos de resolução para uma equação:

{mathsteps}

Sua tarefa é fornecer uma dica útil para o aluno resolver a equação, baseando-se nesses passos, mas sem revelar a resposta final. A dica deve ser natural e auxiliar o aluno a progredir.

Se a mensagem do usuário for um pedido de dica, forneça uma dica. Caso contrário, forneça a solução passo a passo em formato LaTeX, com quebras de linha para cada passo. Certifique-se de que todo o conteúdo LaTeX esteja entre cifrões ($).

Mensagem do usuário: {user_message}
"""

EXTRACT_EQUATION_PROMPT = """
Você é um sistema especialista em equações de primeiro grau.
Abaixo está a mensagem de um aluno. Sua tarefa é:

Identificar e extrair a equação de primeiro grau contida na mensagem. Se houver várias equações, extraia a mais relevante. Se não houver uma equação clara, retorne uma string vazia.

Use ponto (.) como separador decimal — não use vírgulas.

Não adicione explicações, comentários ou qualquer texto além da equação.

Mensagem do aluno:
{user_message}
"""

INTENT_CLASSIFICATION_PROMPT = """
Classifique a intenção do usuário com base na seguinte mensagem:

Mensagem: {user_message}

Opções de intenção:
- HINT: O usuário está pedindo uma dica.
- EXPLAIN_STEP: O usuário está pedindo uma explicação passo a passo.
- SOLVE_EQUATION: O usuário está pedindo a solução final da equação.
- ANSWER_SUBMISSION: O usuário está enviando uma resposta para a equação atual.
- OTHER: A intenção do usuário não se encaixa nas categorias acima.

Retorne apenas a palavra-chave da intenção (ex: HINT, EXPLAIN_STEP, SOLVE_EQUATION, ANSWER_SUBMISSION, OTHER).
"""

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

async def extract_equations(user_message: str):
    model = ChatOllama(model=MODEL_NAME, temperature=0.1)

    prompt_template = PromptTemplate.from_template(EXTRACT_EQUATION_PROMPT)

    chain = prompt_template | model

    full_response = ""
    response = chain.invoke({"user_message": user_message})
    return response.content
    
async def extract_and_solve(user_message: str):
    model = ChatOllama(model=MODEL_NAME)

    # Classify user intent
    prompt_template_intent = PromptTemplate.from_template(INTENT_CLASSIFICATION_PROMPT)
    chain_intent = prompt_template_intent | model
    intent_response = chain_intent.invoke({"user_message": user_message})
    user_intent = intent_response.content.strip().upper()
    print(f"User intent: {user_intent}")

    if user_intent == "HINT":
        prompt_template_solve = PromptTemplate.from_template(REWRITE_STEPS_PROMPT)
        chain_solve = prompt_template_solve | model
        equation_content = await extract_equations(user_message)
        full_response = ""
        response = chain_solve.astream({"mathsteps": solve_equation_with_sympy(equation_content), "user_message": user_message})
        async for token in response:
            full_response += token.content
        return full_response
    elif user_intent == "EXPLAIN_STEP":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para explicar passo a passo. Por favor, forneça a equação."
        return get_equation_step_by_step(equation_content)
    elif user_intent == "SOLVE_EQUATION":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para resolver. Por favor, forneça a equação."
        return show_the_solution(equation_content)
    elif user_intent == "ANSWER_SUBMISSION":
        # This case is handled on the frontend, so we don't need to do anything here
        return ""
    else: # OTHER or any unhandled intent
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem. Por favor, forneça a equação ou peça uma dica."
        
        prompt_template_solve = PromptTemplate.from_template(REWRITE_STEPS_PROMPT)
        chain_solve = prompt_template_solve | model

        full_response = ""
        response = chain_solve.astream({"mathsteps": solve_equation_with_sympy(equation_content), "user_message": user_message})
        
        async for token in response:
            full_response += token.content
        
        # Store the question and solution in history
        solved_problems_history.append({"question": user_message, "solution": full_response})
        
        return full_response
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EquationRequest(BaseModel):
    user_message: str

class GenerateEquationResponse(BaseModel):
    equation: str
    answer: float
    variable: str

def generate_equation_sympy(retry_count=5):
    x = sympy.symbols('x')
    # Generate random coefficients and constants
    a = random.randint(1, 10)
    b = random.randint(-10, 10)
    c = random.randint(1, 10)
    d = random.randint(-10, 10)

    # Create a linear equation: ax + b = cx + d
    equation_str = f"{a}*x + {b} = {c}*x + {d}"
    
    # Solve the equation to get the answer
    try:
        lhs = sympy.sympify(f"{a}*x + {b}")
        rhs = sympy.sympify(f"{c}*x + {d}")
        equation_sympy = sympy.Eq(lhs, rhs)
        print(f"Generated equation: {equation_sympy}")
        solution = sympy.solve(equation_sympy, x)
        print(f"SymPy solution: {solution}")
        
        if solution and len(solution) > 0:
            # Convert sympy number to float
            ans = float(solution[0])
            return {"equation": equation_str, "answer": ans, "variable": "x"}
        else:
            # Handle cases with no solution or infinite solutions
            print(f"No unique solution found for {equation_sympy}. Retrying...")
            if retry_count > 0:
                return generate_equation_sympy(retry_count - 1)
            else:
                raise Exception("Failed to generate a unique solvable equation after multiple retries.")
    except Exception as e:
        print(f"Error solving equation: {e}")
        if retry_count > 0:
            return generate_equation_sympy(retry_count - 1)
        else:
            raise Exception(f"Failed to generate a unique solvable equation after multiple retries: {e}")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": user_intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    