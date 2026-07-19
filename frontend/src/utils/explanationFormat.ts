export type ExplanationVerdict = 'correct' | 'incorrect'

export type ExplanationBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullets'; items: string[] }
  | {
      kind: 'verdict'
      label: string
      verdict: ExplanationVerdict
      body: string
    }

const HEADER_SPLIT =
  /(?=(?:Statement\s+\d+|Option\s+[a-dA-D])\s+is\s+(?:correct|incorrect|not\s+correct)\b)/i

const HEADER_MATCH =
  /^(Statement\s+\d+|Option\s+[a-dA-D])\s+is\s+(correct|incorrect|not\s+correct)\s*:?\s*([\s\S]*)$/i

const TRAILING_VERDICT =
  /^(.*?)\s*(?:So,\s*)?(statement\s+\d+|option\s+[a-dA-D])\s+is\s+(not\s+correct|incorrect|correct)\.?\s*$/i

function normalizeVerdict(raw: string): ExplanationVerdict {
  const value = raw.toLowerCase()
  if (value.includes('incorrect') || value.includes('not correct')) {
    return 'incorrect'
  }
  return 'correct'
}

function formatLabel(raw: string): string {
  const statement = raw.match(/^statement\s+(\d+)$/i)
  if (statement) {
    return `Statement ${statement[1]}`
  }
  const option = raw.match(/^option\s+([a-dA-D])$/i)
  if (option) {
    return `Option ${option[1].toUpperCase()}`
  }
  return raw.trim()
}

function pushParagraphs(blocks: ExplanationBlock[], text: string) {
  const chunks = text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  for (const chunk of chunks) {
    blocks.push({ kind: 'paragraph', text: chunk })
  }
}

function parseFreeform(text: string): ExplanationBlock[] {
  const blocks: ExplanationBlock[] = []
  const lines = text.replace(/\r/g, '').split('\n')
  let paragraph: string[] = []
  let bullets: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return
    }
    pushParagraphs(blocks, paragraph.join('\n'))
    paragraph = []
  }

  const flushBullets = () => {
    if (bullets.length === 0) {
      return
    }
    const plain: string[] = []
    for (const item of bullets) {
      const trailing = item.match(TRAILING_VERDICT)
      if (trailing && trailing[1].trim()) {
        if (plain.length > 0) {
          blocks.push({ kind: 'bullets', items: plain.splice(0) })
        }
        blocks.push({
          kind: 'verdict',
          label: formatLabel(trailing[2]),
          verdict: normalizeVerdict(trailing[3]),
          body: trailing[1].trim(),
        })
      } else {
        plain.push(item)
      }
    }
    if (plain.length > 0) {
      blocks.push({ kind: 'bullets', items: plain })
    }
    bullets = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushBullets()
      flushParagraph()
      continue
    }
    if (/^[-–—]\s+/.test(line)) {
      flushParagraph()
      bullets.push(line.replace(/^[-–—]\s+/, '').trim())
      continue
    }
    flushBullets()
    paragraph.push(line)
  }
  flushBullets()
  flushParagraph()
  return blocks
}

/** Display-time parse of coaching explanation text into structured blocks. */
export function parseExplanation(text: string): ExplanationBlock[] {
  const normalized = text.replace(/\u25cf/g, '-').replace(/●/g, '-').trim()
  if (!normalized) {
    return []
  }

  const parts = normalized.split(HEADER_SPLIT)
  const blocks: ExplanationBlock[] = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) {
      continue
    }
    const header = trimmed.match(HEADER_MATCH)
    if (header) {
      const body = header[3].trim()
      blocks.push({
        kind: 'verdict',
        label: formatLabel(header[1]),
        verdict: normalizeVerdict(header[2]),
        body,
      })
      continue
    }
    blocks.push(...parseFreeform(trimmed))
  }

  return blocks
}
