import type { ExamSummary, TestSummary, YearSummary } from '../types/quiz'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) {
        detail = body.detail
      }
    } catch {
      // Keep default detail when response is not JSON.
    }
    throw new ApiError(detail, response.status)
  }
  return (await response.json()) as T
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function fetchExams(): Promise<ExamSummary[]> {
  return request<ExamSummary[]>('/api/exams')
}

export function fetchUpscYears(): Promise<YearSummary[]> {
  return request<YearSummary[]>('/api/exams/upsc/years')
}

export function fetchUpscTestsForYear(year: number): Promise<TestSummary[]> {
  return request<TestSummary[]>(`/api/exams/upsc/${year}/tests`)
}

export async function fetchTest(testId: string): Promise<TestSummary> {
  // Detail payload includes questions; navigation pages only need summary fields.
  const detail = await request<TestSummary & { questions?: unknown }>(
    `/api/tests/${testId}`,
  )
  return {
    id: detail.id,
    exam: detail.exam,
    year: detail.year,
    paper: detail.paper,
    series: detail.series,
    slug: detail.slug,
    duration_minutes: detail.duration_minutes,
    maximum_marks: detail.maximum_marks,
    total_questions: detail.total_questions,
    questions_for_scoring: detail.questions_for_scoring,
    marks_per_correct: detail.marks_per_correct,
    negative_marks: detail.negative_marks,
    dropped_question_numbers: detail.dropped_question_numbers,
    status: detail.status,
  }
}
