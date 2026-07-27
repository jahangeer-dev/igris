import { Effect } from "effect"

// AI-slop comment patterns to reject
const SLOP_PATTERNS = [
  "# This function", "# This method", "# This class", "# Constructor for",
  "# Helper function", "# Utility function", "# Main function", "# Entry point",
  "# Export", "# Import", "# Return", "# Handle", "# Process", "# Initialize",
  "# Setup", "# Clean up", "# TODO:", "# FIXME:", "# HACK:", "# NOTE:",
  "# WARNING:", "# IMPORTANT:", "# See also:", "# References:", "# Dependencies:",
  "# Parameters:", "# Returns:", "# Throws:", "# Example:", "# Usage:",
  "# @param", "# @return", "# @throws",
  "// This function", "// This method", "// This class", "// Constructor for",
  "// Helper function", "// Utility function", "// Main function", "// Entry point",
  "// Export", "// Import", "// Return", "// Handle", "// Process",
  "// Initialize", "// Setup", "// Clean up",
  "// TODO:", "// FIXME:", "// HACK:", "// NOTE:", "// WARNING:", "// IMPORTANT:",
  "/* This function", "/* This method", "/* This class", "/* Constructor for",
  "/* Helper function", "/* Utility function", "/* Main function", "/* Entry point",
  "/* Export", "/* Import", "/* Return", "/* Handle", "/* Process",
  "/* Initialize", "/* Setup", "/* Clean up",
]

const EDIT_TOOLS = new Set(["edit", "write", "multiedit", "apply_patch"])

function isMarkdown(filePath: string): boolean {
  return /\.(md|mdx|markdown)$/i.test(filePath)
}

function hasSlop(content: string): string | undefined {
  const lower = content.toLowerCase()
  for (const pattern of SLOP_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      return pattern
    }
  }
  return undefined
}

function commentRatio(content: string): number {
  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length <= 10) return 0
  const commentLines = lines.filter((l) => /^\s*(\/\/|\/\*|#)/.test(l)).length
  return (commentLines * 100) / lines.length
}

function extractContent(tool: string, args: unknown): { file?: string; content?: string } {
  const a = args as Record<string, unknown>
  if (tool === "write") {
    return { file: a.filePath as string, content: a.content as string }
  }
  if (tool === "edit" || tool === "multiedit") {
    return { file: a.filePath as string, content: a.newString as string }
  }
  if (tool === "apply_patch") {
    return { file: a.filePath as string, content: a.patch as string }
  }
  return {}
}

export function check(tool: string, args: unknown): Effect.Effect<void> {
  if (!EDIT_TOOLS.has(tool)) return Effect.void

  const { file, content } = extractContent(tool, args)
  if (!file || !content) return Effect.void
  if (isMarkdown(file)) return Effect.void

  const slop = hasSlop(content)
  if (slop) {
    return Effect.die(
      new Error(
        `Comment check failed: AI-slop pattern "${slop}" detected in ${file}.\n` +
        "Remove unnecessary comments. Code should be self-documenting.\n" +
        "Only add comments for complex business logic, not obvious code.",
      ),
    )
  }

  const ratio = commentRatio(content)
  if (ratio > 30) {
    return Effect.die(
      new Error(
        `Comment check failed: ${ratio.toFixed(0)}% of lines are comments in ${file}.\n` +
        "Reduce comments. Code should be self-documenting.\n" +
        "Only add comments for complex business logic, not obvious code.",
      ),
    )
  }

  return Effect.void
}
