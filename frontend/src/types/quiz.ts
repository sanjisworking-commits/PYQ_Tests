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

export type QuestionType =
  | 'standard_mcq'
  | 'multiple_statements'
  | 'count_correct'
  | 'count_incorrect'
  | 'assertion_reason'
  | 'assertion_support'
  | 'matching_pairs'
  | 'matching_lists'
  | 'table_based'
  | 'case_based'

export type QuestionOption = {
  label: string
  text: string
}

export type QuestionStatement = {
  label: string
  text: string
}

export type MatchingPair = {
  left: string
  right: string
}

export type MatchingLists = {
  list_i: QuestionStatement[]
  list_ii: QuestionStatement[]
}

export type QuestionTable = {
  headers: string[]
  rows: string[][]
}

export type StudyRef = {
  subject: string
  topic: string
  subtopic: string
  ncert_hint: string | null
}

export type SourceExplanation = {
  source: 'forumias' | 'vajiram' | string
  source_label: string
  source_answer: string | null
  explanation: string
  source_url: string | null
}

export type QuestionNote = {
  test_id: string
  question_number: number
  body: string
  updated_at: string
}

export type Question = {
  number: number
  type: QuestionType
  stem: string
  statements: QuestionStatement[]
  pairs: MatchingPair[]
  lists: MatchingLists | null
  table: QuestionTable | null
  case_text: string | null
  options: QuestionOption[]
  is_dropped: boolean
  study_refs?: StudyRef[]
}

export type TestDetail = TestSummary & {
  questions: Question[]
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted'

export type AttemptResponse = {
  question_number: number
  selected_option: string | null
  is_marked_for_review: boolean
  is_visited: boolean
  updated_at: string
}

export type Attempt = {
  id: string
  test_id: string
  status: AttemptStatus
  started_at: string
  expires_at: string
  submitted_at: string | null
  score: number | null
  maximum_marks: number
  correct_count: number | null
  incorrect_count: number | null
  unattempted_count: number | null
  dropped_count: number | null
  accuracy: number | null
  responses: AttemptResponse[]
}

export type ResponseUpdate = {
  question_number: number
  selected_option?: string | null
  is_marked_for_review?: boolean
  is_visited?: boolean
}

export type QuestionPaletteStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_marked_for_review'
  | 'dropped'

export type ReviewQuestion = {
  number: number
  type: string
  stem: string
  is_dropped: boolean
  selected_option: string | null
  correct_option: string | null
  is_correct: boolean | null
  options: QuestionOption[]
  statements: QuestionStatement[]
  pairs: MatchingPair[]
  lists: MatchingLists | null
  table: QuestionTable | null
  case_text: string | null
  study_refs: StudyRef[]
  explanations: SourceExplanation[]
}

export type AttemptReview = {
  attempt: Attempt
  questions: ReviewQuestion[]
}

export type DashboardAttempt = {
  attempt_id: string
  status: AttemptStatus
  score: number | null
  maximum_marks: number
  correct_count: number | null
  incorrect_count: number | null
  unattempted_count: number | null
  dropped_count: number | null
  accuracy: number | null
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
}

export type DashboardTestGroup = {
  test_id: string
  exam: string
  year: number
  paper: string
  series: string
  slug: string
  maximum_marks: number
  attempts: DashboardAttempt[]
}

export type DashboardResponse = {
  total_attempts: number
  tests: DashboardTestGroup[]
}
