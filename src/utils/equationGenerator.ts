
interface Equation {
  equation: string;
  answer: number;
  variable: string;
  steps: string[];
}

export const generateEquation = (): Equation => {
  const variables = ['x', 'y', 'z', 'a', 'b'];
  const variable = variables[Math.floor(Math.random() * variables.length)];
  
  // Generate random coefficients and constants
  const coefficient = Math.floor(Math.random() * 9) + 1; // 1-9
  const constant1 = Math.floor(Math.random() * 20) - 10; // -10 to 9
  const constant2 = Math.floor(Math.random() * 20) - 10; // -10 to 9
  
  // Generate a random answer
  const answer = Math.floor(Math.random() * 20) - 10; // -10 to 9
  
  // Calculate what the right side should be
  const rightSide = coefficient * answer + constant1;
  
  // Format the equation
  let equation = `${coefficient}${variable}`;
  if (constant1 > 0) {
    equation += ` + ${constant1}`;
  } else if (constant1 < 0) {
    equation += ` - ${Math.abs(constant1)}`;
  }
  equation += ` = ${rightSide}`;
  
  // Generate solution steps
  const steps = generateSolutionSteps(coefficient, constant1, rightSide, variable);
  
  return {
    equation,
    answer,
    variable,
    steps
  };
};

const generateSolutionSteps = (coefficient: number, constant: number, rightSide: number, variable: string): string[] => {
  const steps = [];
  
  if (constant !== 0) {
    if (constant > 0) {
      steps.push(`Subtract ${constant} from both sides`);
      steps.push(`${coefficient}${variable} = ${rightSide - constant}`);
    } else {
      steps.push(`Add ${Math.abs(constant)} to both sides`);
      steps.push(`${coefficient}${variable} = ${rightSide - constant}`);
    }
  }
  
  if (coefficient !== 1) {
    steps.push(`Divide both sides by ${coefficient}`);
    steps.push(`${variable} = ${(rightSide - constant) / coefficient}`);
  }
  
  return steps;
};

export const checkAnswer = (userAnswer: number, correctAnswer: number): boolean => {
  return Math.abs(userAnswer - correctAnswer) < 0.001; // Allow for small floating point errors
};

export const getHint = (equation: Equation, hintNumber: number): string => {
  const hints = [
    `Remember: to solve for ${equation.variable}, you need to isolate it on one side of the equation.`,
    `First step: ${equation.steps[0] || 'Try to eliminate constants from the left side.'}`,
    `Here's the step-by-step solution: ${equation.steps.join(' → ')}`
  ];
  
  return hints[Math.min(hintNumber, hints.length - 1)] || "You're doing great! Keep trying.";
};
