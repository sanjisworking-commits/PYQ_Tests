export type YearStatus = 'available' | 'coming_soon'

export type ExamSummary = {
  id: string
  name: string
  slug: string
}

export type YearSummary = {
  year: number
  status: YearStatus
}

export type TestSummary = {
  id: string
  exam: string
  year: number
  paper: string
  series: string
  slug: string
  duration_minutes: number
  maximum_marks: number
  total_questions: number
  questions_for_scoring: number
  marks_per_correct: number
  negative_marks: number
  dropped_question_numbers: number[]
  status: YearStatus
}
