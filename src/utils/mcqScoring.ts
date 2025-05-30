import type { Question, QuestionOption } from '../types/form.types';

export interface MCQResponse {
  questionId: number;
  selectedOptionId: number | null;
  selectedOptionIds?: number[]; // For multiple correct answers
  isCorrect: boolean;
  score: number;
  maxScore: number;
  explanation?: string;
}

export interface MCQScoringResult {
  totalScore: number;
  maxTotalScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  percentage: number;
  responses: MCQResponse[];
}

export class MCQScoringEngine {
  /**
   * Calculate score for a single MCQ question
   */
  static calculateQuestionScore(
    question: Question,
    selectedOptionId: number | null,
    selectedOptionIds?: number[]
  ): MCQResponse {
    const response: MCQResponse = {
      questionId: question.id,
      selectedOptionId,
      selectedOptionIds,
      isCorrect: false,
      score: 0,
      maxScore: question.points || 1,
    };

    if (!question.options || question.options.length === 0) {
      return response;
    }

    const settings = question.mcqSettings;
    const correctOptions = question.options.filter(opt => opt.isCorrect);
    
    // Handle no selection
    if (!selectedOptionId && (!selectedOptionIds || selectedOptionIds.length === 0)) {
      return response;
    }

    // Single correct answer (standard MCQ)
    if (!settings?.allowMultipleCorrect) {
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      
      if (selectedOption?.isCorrect) {
        response.isCorrect = true;
        response.score = selectedOption.points || question.points || 1;
        response.explanation = selectedOption.explanation;
      } else {
        // Apply negative marking
        const negativePoints = selectedOption?.negativePoints || 
                              question.negativePoints || 
                              (settings?.defaultNegativePoints ?? 0);
        
        if (settings?.scoringMethod === 'negative_marking') {
          response.score = -negativePoints;
        }
        response.explanation = selectedOption?.explanation;
      }
    }
    // Multiple correct answers
    else {
      const selectedIds = selectedOptionIds || (selectedOptionId ? [selectedOptionId] : []);
      const correctIds = correctOptions.map(opt => opt.id);
      
      const correctlySelected = selectedIds.filter(id => correctIds.includes(id));
      const incorrectlySelected = selectedIds.filter(id => !correctIds.includes(id));
      
      if (settings?.partialCredit) {
        // Partial credit scoring
        const correctRatio = correctlySelected.length / correctIds.length;
        const penaltyRatio = incorrectlySelected.length / question.options.length;
        
        response.score = Math.max(0, 
          (correctRatio * (question.points || 1)) - 
          (penaltyRatio * (question.negativePoints || 0))
        );
        response.isCorrect = correctRatio === 1 && incorrectlySelected.length === 0;
      } else {
        // All-or-nothing scoring
        const isFullyCorrect = correctlySelected.length === correctIds.length && 
                              incorrectlySelected.length === 0;
        
        if (isFullyCorrect) {
          response.isCorrect = true;
          response.score = question.points || 1;
        } else if (incorrectlySelected.length > 0 && settings?.scoringMethod === 'negative_marking') {
          response.score = -(question.negativePoints || 0);
        }
      }
    }

    return response;
  }

  /**
   * Calculate total score for multiple MCQ questions
   */
  static calculateTotalScore(
    questions: Question[],
    responses: Array<{
      questionId: number;
      selectedOptionId?: number | null;
      selectedOptionIds?: number[];
    }>
  ): MCQScoringResult {
    const mcqQuestions = questions.filter(q => q.type === 'multiple_choice');
    const scoredResponses: MCQResponse[] = [];
    
    let totalScore = 0;
    let maxTotalScore = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;

    mcqQuestions.forEach(question => {
      const userResponse = responses.find(r => r.questionId === question.id);
      const questionScore = this.calculateQuestionScore(
        question,
        userResponse?.selectedOptionId || null,
        userResponse?.selectedOptionIds
      );

      scoredResponses.push(questionScore);
      totalScore += questionScore.score;
      maxTotalScore += questionScore.maxScore;

      if (!userResponse?.selectedOptionId && (!userResponse?.selectedOptionIds || userResponse.selectedOptionIds.length === 0)) {
        unanswered++;
      } else if (questionScore.isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    });

    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    return {
      totalScore,
      maxTotalScore,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      responses: scoredResponses,
    };
  }

  /**
   * Get detailed feedback for a question response
   */
  static getQuestionFeedback(question: Question, response: MCQResponse): string {
    if (!question.options) return '';

    const correctOptions = question.options.filter(opt => opt.isCorrect);
    const selectedOption = question.options.find(opt => opt.id === response.selectedOptionId);

    let feedback = '';

    if (response.isCorrect) {
      feedback = '✅ Correct! ';
      if (selectedOption?.explanation) {
        feedback += selectedOption.explanation;
      }
    } else {
      feedback = '❌ Incorrect. ';
      if (selectedOption?.explanation) {
        feedback += `Your answer: ${selectedOption.explanation}. `;
      }
      
      if (question.mcqSettings?.showCorrectAnswers && correctOptions.length > 0) {
        const correctAnswers = correctOptions.map(opt => opt.content).join(', ');
        feedback += `Correct answer(s): ${correctAnswers}`;
      }
    }

    return feedback;
  }
}