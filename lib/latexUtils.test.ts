import { parseLatexContent } from './latexUtils';

const testLatex = `
\\textbf{Question:}

A researcher is studying the effect of a new teaching method on students'
mathematics scores. A random sample of 30 students who underwent the new
teaching method has a mean score of 78 with a standard deviation of 10.
Assuming that the population of scores follows a normal distribution, 

\\begin{enumerate}
    \\item Construct a 95\\% confidence interval for the mean score of all 
    students using the new teaching method.
    \\item If the researcher wishes to determine whether the new teaching 
    method results in a statistically significant improvement over the
    historical mean score of 75, perform a hypothesis test at the 
    5\\% significance level. State the null and alternative hypotheses,
    calculate the test statistic, and conclude whether or not the 
    new teaching method is statistically significant.
\\end{enumerate}
`;

const expectedOutput = `
A researcher is studying the effect of a new teaching method on students'
mathematics scores. A random sample of 30 students who underwent the new
teaching method has a mean score of 78 with a standard deviation of 10.
Assuming that the population of scores follows a normal distribution,

• Construct a 95% confidence interval for the mean score of all 
students using the new teaching method.
• If the researcher wishes to determine whether the new teaching 
method results in a statistically significant improvement over the
historical mean score of 75, perform a hypothesis test at the 
5% significance level. State the null and alternative hypotheses,
calculate the test statistic, and conclude whether or not the 
new teaching method is statistically significant.
`;

const result = parseLatexContent(testLatex);

if (result.trim() === expectedOutput.trim()) {
  console.log('Test passed!');
} else {
  console.log('Test failed. Output:');
  console.log(result);
}