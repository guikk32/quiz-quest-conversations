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
from .tools import get_equation_step_by_step, show_the_solution
from .math_utils import solve_equation_with_sympy
from .app import solve_equation_with_sympy

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")
MODEL_NAME = os.getenv("MODEL_NAME")

REWRITE_STEPS_PROMPT = """
Você é um sistema especialista em equações de primeiro grau. Considere os seguintes passos de resolução para uma equação:

{mathsteps}

Sua tarefa é fornecer uma dica útil para o aluno resolver a equação, baseando-se nesses passos, mas sem revelar a resposta final. A dica deve ser natural e auxiliar o aluno a progredir.

Se a mensagem do usuário for um pedido de dica, forneça uma dica. Caso contrário, forneça a solução passo a passo, com quebras de linha para cada passo. Não inclua cifrões ($), formatação LaTeX, ou qualquer outro caractere especial de formatação. Apenas texto simples.

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
        response = chain_solve.astream({"mathsteps": get_equation_step_by_step(equation_content), "user_message": user_message})
        async for token in response:
            full_response += token.content
        return full_response.replace('
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para explicar passo a passo. Por favor, forneça a equação.", user_intent
        return str(get_equation_step_by_step(equation_content)), user_intent
    elif user_intent == "SOLVE_EQUATION":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para resolver. Por favor, forneça a equação.", user_intent
        return str(show_the_solution(equation_content)), user_intent
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
        response = chain_solve.astream({"mathsteps": get_equation_step_by_step(equation_content), "user_message": user_message})
        
        async for token in response:
            full_response += token.content
        
        # Store the question and solution in history
        solved_problems_history.append({"question": user_message, "solution": full_response})
        
        return full_response, user_intent
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    , ''), user_intent
    elif user_intent == "EXPLAIN_STEP":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para explicar passo a passo. Por favor, forneça a equação.", user_intent
        return str(get_equation_step_by_step(equation_content)), user_intent
    elif user_intent == "SOLVE_EQUATION":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para resolver. Por favor, forneça a equação.", user_intent
        return str(show_the_solution(equation_content)), user_intent
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
        response = chain_solve.astream({"mathsteps": get_equation_step_by_step(equation_content), "user_message": user_message})
        
        async for token in response:
            full_response += token.content
        
        # Store the question and solution in history
        solved_problems_history.append({"question": user_message, "solution": full_response})
        
        return full_response.replace('
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    , ''), user_intent
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    , ''), user_intent
    elif user_intent == "EXPLAIN_STEP":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para explicar passo a passo. Por favor, forneça a equação.", user_intent
        return str(get_equation_step_by_step(equation_content)), user_intent
    elif user_intent == "SOLVE_EQUATION":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para resolver. Por favor, forneça a equação.", user_intent
        return str(show_the_solution(equation_content)), user_intent
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
        response = chain_solve.astream({"mathsteps": get_equation_step_by_step(equation_content), "user_message": user_message})
        
        async for token in response:
            full_response += token.content
        
        # Store the question and solution in history
        solved_problems_history.append({"question": user_message, "solution": full_response})
        
        return full_response, user_intent
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    , ''), user_intent
    elif user_intent == "EXPLAIN_STEP":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para explicar passo a passo. Por favor, forneça a equação.", user_intent
        return str(get_equation_step_by_step(equation_content)), user_intent
    elif user_intent == "SOLVE_EQUATION":
        equation_content = await extract_equations(user_message)
        if not equation_content:
            return "Não consegui encontrar uma equação na sua mensagem para resolver. Por favor, forneça a equação.", user_intent
        return str(show_the_solution(equation_content)), user_intent
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
        response = chain_solve.astream({"mathsteps": get_equation_step_by_step(equation_content), "user_message": user_message})
        
        async for token in response:
            full_response += token.content
        
        # Store the question and solution in history
        solved_problems_history.append({"question": user_message, "solution": full_response})
        
        return full_response.replace('
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    , ''), user_intent
    

app = FastAPI()

solved_problems_history = [] # In-memory storage for solved problems

origins = [
    "http://localhost:5173",  # Your frontend development server
    "http://192.168.151.66:8080", # Your specific IP address
    "http://192.168.0.103:8000", # Corrected port for frontend access
    "http://192.168.0.103:8080", # Frontend development server
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

def generate_equation_sympy(max_retries=10):
    x = sympy.symbols('x')
    for _ in range(max_retries):
        a = random.randint(1, 10)
        b = random.randint(-10, 10)
        c = random.randint(1, 10)
        d = random.randint(-10, 10)

        # Ensure 'a' and 'c' are different to guarantee a unique solution for a linear equation
        if a == c:
            continue

        equation_str = f"{a}*x + {b} = {c}*x + {d}"
        
        try:
            lhs = sympy.sympify(f"{a}*x + {b}")
            rhs = sympy.sympify(f"{c}*x + {d}")
            equation_sympy = sympy.Eq(lhs, rhs)
            solution = sympy.solve(equation_sympy, x)
            
            if solution and len(solution) > 0:
                ans = float(solution[0])
                return {"equation": equation_str, "answer": ans, "variable": "x"}
        except Exception as e:
            print(f"Error solving equation during generation: {e}")
            # Continue to the next iteration
    raise Exception("Failed to generate a unique solvable equation after multiple retries.")

@app.post("/solve_equation")
async def solve_equation_endpoint(request: EquationRequest):
    solution, intent = await extract_and_solve(request.user_message)
    return {"solution": solution, "intent": intent}

@app.get("/history")
async def get_history():
    return solved_problems_history

@app.get("/generate_equation", response_model=GenerateEquationResponse)
async def generate_equation_endpoint():
    try:
        equation_data = generate_equation_sympy()
        print(f"Generated equation data: {equation_data}")
        return equation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    