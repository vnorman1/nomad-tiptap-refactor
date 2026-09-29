---
name: prosemirror-testing
description: Property-based testing invariants and verification strategies for TipTap and ProseMirror schemas using fast-check.
---
# ProseMirror & TipTap Testing Invariants Skill

When building or refactoring TipTap blocks, enforce these automated verification patterns:

## 1. Round-Trip Serialization Invariant
- **Rule**: `parseHTML(renderHTML(doc)) == doc`
- Use `fast-check` to generate arbitrary node hierarchies and confirm no text or attributes are dropped during JSON-to-HTML-to-JSON cycles.

## 2. Delimiter Boundary Invariant
- Block-level math and raw code blocks must strictly preserve bounding tags across arbitrary Unicode input strings.