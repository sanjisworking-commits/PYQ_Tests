import type {
  AttemptResponse,
  Question,
  QuestionPaletteStatus,
} from '../types/quiz'
import { parseUtcMs } from './datetime'

export function getQuestionStatus(
  question: Question,
  response: AttemptResponse | undefined,
): QuestionPaletteStatus {
  if (question.is_dropped) {
    return 'dropped'
  }

  const answered = Boolean(response?.selected_option)
  const marked = Boolean(response?.is_marked_for_review)
  const visited = Boolean(response?.is_visited)

  if (answered && marked) {
    return 'answered_marked_for_review'
  }
  if (marked) {
    return 'marked_for_review'
  }
  if (answered) {
    return 'answered'
  }
  if (visited) {
    return 'not_answered'
  }
  return 'not_visited'
}

export function summarizeResponses(
  questions: Question[],
  responses: AttemptResponse[],
): {
  answered: number
  notAnswered: number
  marked: number
  notVisited: number
  dropped: number
} {
  const byNumber = new Map(
    responses.map((response) => [response.question_number, response]),
  )

  let answered = 0
  let notAnswered = 0
  let marked = 0
  let notVisited = 0
  let dropped = 0

  for (const question of questions) {
    const status = getQuestionStatus(question, byNumber.get(question.number))
    switch (status) {
      case 'dropped':
        dropped += 1
        break
      case 'answered':
      case 'answered_marked_for_review':
        answered += 1
        if (status === 'answered_marked_for_review') {
          marked += 1
        }
        break
      case 'marked_for_review':
        marked += 1
        notAnswered += 1
        break
      case 'not_answered':
        notAnswered += 1
        break
      case 'not_visited':
        notVisited += 1
        break
    }
  }

  return { answered, notAnswered, marked, notVisited, dropped }
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatTimeTaken(
  startedAt: string,
  submittedAt: string | null,
): string {
  if (!submittedAt) {
    return '—'
  }
  const startMs = parseUtcMs(startedAt)
  const endMs = parseUtcMs(submittedAt)
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return '—'
  }
  return formatDuration(Math.floor((endMs - startMs) / 1000))
}

export function getReviewVerdict(question: {
  is_dropped: boolean
  selected_option: string | null
  is_correct: boolean | null
}): 'dropped' | 'correct' | 'incorrect' | 'unattempted' {
  if (question.is_dropped) {
    return 'dropped'
  }
  if (question.selected_option == null) {
    return 'unattempted'
  }
  if (question.is_correct) {
    return 'correct'
  }
  return 'incorrect'
}
