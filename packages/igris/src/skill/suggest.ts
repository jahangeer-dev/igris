import { Skill } from "."

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "has", "have", "been", "some",
  "same", "also", "just", "very", "too", "how", "what", "when", "where",
  "which", "who", "why", "make", "like", "than", "then", "that", "this",
  "with", "from", "your", "about", "into", "over", "them", "could",
  "would", "should", "done", "does", "doing", "made", "make", "makes",
  "need", "want", "help", "tell", "show", "find", "give", "take",
])

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().split(/[\s\W]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  return new Set(words)
}

function score(skill: Skill.Info, tokens: Set<string>): number {
  const target = `${skill.name} ${skill.description ?? ""}`.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (target.includes(token)) {
      // Name matches count more than description matches
      score += skill.name.toLowerCase().includes(token) ? 3 : 1
    }
  }
  return score
}

export function match(text: string, skills: Skill.Info[]): Skill.Info | undefined {
  if (!text || skills.length === 0) return undefined
  const tokens = tokenize(text)
  let best: Skill.Info | undefined
  let bestScore = 0
  for (const skill of skills) {
    const s = score(skill, tokens)
    if (s > bestScore) {
      bestScore = s
      best = skill
    }
  }
  return bestScore >= 2 ? best : undefined
}

export function suggest(text: string, skills: Skill.Info[]): string | undefined {
  const m = match(text, skills)
  if (!m) return undefined
  return `[system] Skill suggestion: "${m.name}" matches your request. Use \`/skill ${m.name}\` or ask the skill tool to load it.\nSkill: ${m.description}`
}
