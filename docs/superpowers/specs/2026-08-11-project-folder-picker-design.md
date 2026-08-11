# Project folder picker design

## Goal

When a user connects an outreach project, they can choose the project folder through the native Windows folder picker instead of typing an absolute path manually. The project name is derived automatically from the selected folder name.

## Scope

- The feature targets the existing Windows local-service workflow.
- The React dialog keeps the existing project metadata submission and account scoping.
- The local service opens the native folder picker and returns either a selected folder path or a cancellation result.
- The existing save endpoint remains the source of truth for persisting project metadata.
- No Excel validation or workbook synchronization is added in this change.

## User flow

1. The user opens “Connect a project”.
2. The user clicks “Choose folder”.
3. The local service opens the Windows folder picker.
4. On selection, the UI fills the folder path and derives the project name from the final folder segment.
5. The path is shown read-only so the user can confirm the selection without editing it.
6. The user saves the project.
7. Cancelling the picker leaves the dialog open without an error. Picker failures show an actionable error and allow retrying.

The save action is disabled until a folder has been selected and while either folder selection or saving is in progress.

## Architecture

The frontend adds a typed `pickProjectFolder` request to the existing API client. The service exposes an authenticated `POST /api/projects/pick-folder` endpoint. The endpoint delegates to a small platform helper that launches the Windows native picker using the local process and returns a structured result. The helper is isolated so the HTTP contract can be tested without opening a real OS dialog.

The service remains loopback-only by default. The selected absolute path is returned only to the authenticated local browser session and is then persisted through the existing project creation endpoint.

For non-Windows environments, the endpoint returns a clear unsupported-platform error rather than silently falling back to a fake picker or browser-only path behavior.

## Error handling and accessibility

- A cancelled dialog is a normal, non-error result.
- Picker startup or platform errors are shown in the existing alert area.
- The choose button has an accessible name and a pending label while the picker is open.
- The path field is labelled and read-only.
- The form remains keyboard navigable and responsive at narrow widths.

## Verification

- Unit-test the folder-name extraction and picker result handling.
- Test the authenticated service contract with the platform helper injected, covering selected, cancelled, and failed picker results.
- Update the Playwright project flow to use the new UI semantics without relying on manual path entry; the browser test will stub the picker boundary at the service level where needed.
- Run format check, typecheck, lint, unit tests, service build, production build, and Playwright smoke tests.
- Inspect the final diff for unrelated changes and verify the dialog at desktop and mobile widths.
