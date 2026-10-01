---
name: prosemirror-testing
description: Formal property-based testing invariants and mathematical verification strategies for TipTap and ProseMirror schemas using fast-check.
---

# ProseMirror & TipTap Testing Invariants Specification

## 1. Round-Trip Serialization & Deserialization Invariants

### 1.1 Structural Isomorphism Contract

* For any valid ProseMirror node tree `Node_A`:
* `Node_A` SHALL serialize to HTML OR Markdown via `renderHTML` / serializer.
* AND the serialized payload SHALL parse back via `parseHTML` / parser into `Node_B`.
* AND `Node_B.toJSON()` MUST deeply equal `Node_A.toJSON()`.


* WHEN evaluating round-trip transformations:
* IF a node contains custom attributes (e.g. `latex`, `language`, `colwidth`):
* THEN the serialization cycle SHALL preserve every attribute without data loss.
* AND attribute types SHALL NOT mutate (e.g. numbers SHALL NOT become strings).
* AND omitted optional attributes SHALL fall back to schema defaults, NOT `undefined`.

### 1.2 Text Content Preservation Rule

* The cumulative text content of a document `doc.textBetween(0, doc.content.size)` SHALL remain invariant across serialization cycles:
* `parse(serialize(doc)).textBetween(...) === doc.textBetween(...)`
* Serialization engines SHALL NOT strip leading, trailing, or repeated internal whitespace UNLESS explicitly specified by node schema constraints.

---

## 2. Delimiter Boundary & Text Escaping Invariants

### 2.1 Enclosure Integrity Contract

* Block-level and inline delimiters (e.g. `$$` for Math, ````` for Code blocks, `*` for Marks) MUST preserve strict syntactic boundaries.
* WHEN arbitrary string payloads generated via `fc.unicodeString()` are wrapped into delimited blocks:
* THEN the opening delimiter MUST match the leading characters of the serialized output.
* AND the closing delimiter MUST match the trailing characters of the serialized output.
* AND internal payload occurrences of the delimiter token MUST be escaped OR encapsulated into safe container blocks.



### 2.2 Collision Resistance Invariant

* IF a raw input string contains exact delimiter tokens (e.g. a LaTeX formula containing `

$$` inside `\text{$$

}`):

* THEN the serializer SHALL escape the delimiter token before wrapping.
* AND the parser SHALL resolve the escaped sequence back to the literal token without premature block termination.
* AND unclosed delimiter sequences SHALL NOT produce corrupted document trees or orphaned child nodes.

---

## 3. Transaction Invertibility & History State Invariants

### 3.1 Step Inversion Mathematical Law

* Every atomic document modification step `Step` MUST define a corresponding inverse step `Step.invert(doc)`.
* FOR ANY valid document state `Doc_0` AND valid transaction step `S`:
* Let `Doc_1 = S.apply(Doc_0).doc`
* Let `S_inv = S.invert(Doc_0)`
* Let `Doc_Restored = S_inv.apply(Doc_1).doc`
* THEN `Doc_Restored.eq(Doc_0)` MUST evaluate to `true`.



### 3.2 History Checkpoint & Undo/Redo Invariants

* WHEN a sequence of $N$ user edits is dispatched via `editor.chain()`:
* Dispatched actions within a single chain MUST merge into exactly ONE history checkpoint.
* Executing `editor.commands.undo()` once MUST restore the document tree to the exact pre-chain state.
* Executing `editor.commands.redo()` immediately after undo MUST restore the exact post-chain state.


* IF an undo operation is executed:
* THEN cursor selection MUST map back to a valid position within the restored node boundaries.
* AND selection coordinates SHALL NOT exceed `doc.content.size`.



---

## 4. Schema Normalization & Attribute Sanitization Contracts

### 4.1 Schema Conformance & Nesting Rules

* Arbitrary AST generation via `fast-check` SHALL NOT violate schema boundary rules:
* Block nodes MUST only contain allowed child nodes according to schema spec.
* Inline marks MUST NOT attach to incompatible node types.
* Table cells MUST strictly reside within table rows, which MUST strictly reside within tables.


* WHEN an invalid or malformed fragment is passed to `schema.nodeFromJSON()`:
* THEN the schema parser SHALL normalize the structure to conform to constraints.
* OR the parser SHALL drop the invalid nodes without throwing unhandled exceptions.



### 4.2 Security & XSS Sanitization Invariant

* Untrusted user input injected into custom NodeViews (such as LaTeX strings, raw code snippets, or URLs) MUST pass through defensive validation.
* WHEN serializing NodeViews to static DOM / HTML:
* Malicious vectors