# OpenCode Project Rules

## 1. Execute, don't just diagnose

For every task:

INSPECT → IDENTIFY → IMPLEMENT → VERIFY → FIX → VERIFY → PASS

If you find a technically solvable problem within the task scope, fix it yourself.

Do not stop at diagnosis.
Do not return FAIL + recommendation when you can perform the fix.
Do not create a new ticket for a solvable problem discovered within the current task scope.

A diagnosis is not completion.
A recommendation is not completion.

## 2. Autonomous execution

Use all available repository, CLI, API, runtime, database, deployment and local-machine access.

OpenCode has technical ownership of the task.

Do not ask the user to:
- run commands you can run;
- inspect code or logs you can inspect;
- perform tests you can perform;
- diagnose problems you can diagnose;
- perform API, database or deployment checks you can perform.

Ask the user only when human intervention is technically unavoidable.

When human intervention is unavoidable, request the minimum single action required, then continue automatically.

## 3. Scope and change isolation

Modify only what is necessary for the current task.

Respect the approved product and existing functionality.

Do not change unrelated areas.

Do not invent requirements, data, credentials, architecture or behavior.

Before implementing, identify:
- IN SCOPE
- OUT OF SCOPE

Do not use a ticket as an opportunity to redesign unrelated functionality.

## 4. Reality check

Before making important changes, verify the real current state through code, execution, APIs, database, runtime or other available evidence.

Do not trust documentation, status labels or previous claims as proof of the current state.

If documentation and reality differ, use the real verified state as the source for implementation.

If a discrepancy is relevant to the current task, resolve it within the task when technically possible.

## 5. Reuse existing mechanisms

Before creating a new mechanism, inspect whether the project already has one that solves the problem.

Prefer extending or reusing existing:
- APIs;
- models;
- services;
- components;
- state;
- authentication;
- integrations;
- utilities;
- synchronization mechanisms.

Do not create parallel systems unnecessarily.

## 6. Verification and Definition of Done

Never consider a task complete only because:
- code was changed;
- a command succeeded;
- an HTTP request returned 200;
- tests passed.

Verify the actual resulting behavior.

Every task must have an objective Definition of Done based on its scope.

If verification fails:

FIX → VERIFY AGAIN

Continue until the issue is resolved or a genuinely unavoidable human intervention is required.

A task is complete only with:

PASS + concrete evidence

## 7. Evidence first

Use the strongest available evidence for each claim.

Prefer, when applicable:
- actual runtime behavior;
- database state;
- API responses;
- browser/E2E behavior;
- logs;
- tests;
- build/type checks.

Do not treat a test PASS alone as proof that the product behavior is complete.

Do not treat HTTP 200 alone as proof that a feature works.

## 8. Efficiency

Correctness and complete resolution always have priority over token savings.

Within that priority:
- Minimize unnecessary token usage.
- Inspect only files, code and systems directly relevant to the task.
- Do not explore unrelated areas.
- Do not repeat known information.
- Do not narrate every step.
- Avoid unnecessary intermediate reports.
- Prefer direct execution over discussion.
- Group related checks and actions when safe.
- Keep final reports concise and evidence-based.

Never sacrifice implementation, correction, testing or verification to save tokens.

## 9. Production safety

For changes involving production data or infrastructure:

INSPECT → DRY-RUN / PLAN → VERIFY → APPLY → VERIFY

Never modify production based only on assumptions or documentation.

Verify the real production result after applying changes.

Avoid destructive operations unless explicitly required and technically justified.

## 10. Security

Never expose secrets, credentials, tokens or sensitive environment variables.

Use available secrets through the environment or runtime when possible.

Never print or include secret values in logs, reports, commits or responses.

## 11. Ticket completion

Use this execution state internally:

PENDING → IN PROGRESS → VERIFYING → PASS

Do not mark a task complete while it still has a known solvable issue within scope.

If a problem is discovered during verification and can be solved within scope, solve it before closing the task.

Do not create unnecessary diagnostic loops or hand off solvable work to the user.

## 12. Release readiness

Before declaring Product Ready or Go Live Ready, verify the relevant critical flows and integrations against real evidence.

Keep these states separate:

Infrastructure Ready ≠ Product Ready ≠ Go Live Ready

Do not declare Go Live Ready without verifying the required product, content, integrations, QA and release criteria.