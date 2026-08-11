# Native Project Folder Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Windows users connect a project by choosing its folder in the native folder picker, with the project name derived from that folder.

**Architecture:** Add a small injectable folder-picker boundary to the local service, expose it through an authenticated project endpoint, and call it from the existing React project dialog. Keep project persistence on the current `/api/projects` endpoint and keep the selected path visible but read-only in the UI.

**Tech Stack:** React 19, TypeScript, Vite, Node.js local HTTP service, Windows PowerShell/System.Windows.Forms, Vitest, Playwright.

## Global Constraints

- The feature targets the existing Windows local-service workflow.
- The service stays loopback-only by default.
- Do not add a browser-only fake path or a new UI library.
- Do not add Excel validation or workbook synchronization in this change.
- A cancelled native dialog is a normal result; picker failures are actionable errors.

---

### Task 1: Add the folder-path naming and service picker contracts

**Files:**
- Create: `src/lib/project.ts`
- Create: `src/lib/project.test.ts`
- Create: `service/src/folder-picker.ts`
- Modify: `service/tsconfig.json`
- Test: `src/lib/project.test.ts`

**Interfaces:**
- `getProjectNameFromFolderPath(folderPath: string): string` returns the final non-empty Windows path segment, or an empty string when no segment exists.
- `FolderPickerResult` is `{ kind: 'selected'; folderPath: string } | { kind: 'cancelled' }`.
- `pickProjectFolder(): Promise<FolderPickerResult>` opens the Windows picker, returns cancellation without throwing, and throws a descriptive error when the platform or picker process fails.
- `createFolderPickerForTests(runner)` lets service tests inject a process runner without opening a real dialog.

- [ ] **Step 1: Write the failing frontend naming tests**

```ts
import { describe, expect, it } from 'vitest';
import { getProjectNameFromFolderPath } from './project';

describe('getProjectNameFromFolderPath', () => {
  it('returns the folder name from a Windows path', () => {
    expect(getProjectNameFromFolderPath('C:\\Work\\Founder outreach')).toBe('Founder outreach');
  });

  it('ignores trailing separators', () => {
    expect(getProjectNameFromFolderPath('C:\\Work\\Founder outreach\\')).toBe('Founder outreach');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the helper is missing**

Run: `npm test -- src/lib/project.test.ts`

Expected: FAIL with a module-not-found error for `src/lib/project`.

- [ ] **Step 3: Implement the minimal path helper**

Split on both `/` and `\\`, remove empty segments, and return the last segment. Do not normalize or expose the path beyond deriving the display name.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `npm test -- src/lib/project.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 5: Write the failing folder-picker contract tests**

Test the injected runner for selected stdout, empty stdout cancellation, non-Windows rejection, and process failure. The tests must not launch PowerShell.

- [ ] **Step 6: Implement `service/src/folder-picker.ts`**

Use `process.platform` to reject non-Windows calls, and on Windows launch `powershell.exe` with `spawn` using a static `System.Windows.Forms.FolderBrowserDialog` script and `windowsHide: true`. Trim stdout; empty stdout is cancellation; non-zero exit or stderr is a descriptive picker error. Export the injectable factory used by tests.

- [ ] **Step 7: Include the new service file in `service/tsconfig.json` and run service tests**

Run: `npm test -- service/src/folder-picker.test.ts`

Expected: PASS with all picker contract cases.

- [ ] **Step 8: Commit the focused contracts and helper**

```text
git add src/lib/project.ts src/lib/project.test.ts service/src/folder-picker.ts service/tsconfig.json service/src/folder-picker.test.ts
git commit -m "feat: add native project folder picker boundary"
```

### Task 2: Expose the authenticated picker endpoint and typed client method

**Files:**
- Modify: `service/src/server.ts`
- Modify: `service/src/server.test.ts`
- Modify: `src/lib/api.ts`

**Interfaces:**
- `createServiceServer(version, dependencies?)` accepts an optional `pickProjectFolder` dependency for HTTP tests.
- `POST /api/projects/pick-folder` returns `200 { folderPath: string }` for selection and `200 { cancelled: true }` for cancellation.
- The endpoint requires the existing session cookie and returns the existing `401` response otherwise.
- `api.pickProjectFolder()` returns `{ folderPath: string } | { cancelled: true }`.

- [ ] **Step 1: Add failing HTTP contract tests with an injected picker**

Add a request helper that can send `POST` and preserve a session cookie. Cover selected response, cancellation response, and unauthenticated `401`. The injected picker returns deterministic results.

- [ ] **Step 2: Run the focused service HTTP tests and confirm they fail**

Run: `npm test -- service/src/server.test.ts`

Expected: FAIL because `/api/projects/pick-folder` currently returns `404`.

- [ ] **Step 3: Implement the endpoint and dependency injection**

Call the injected/default picker after authentication, respond with the selected path or cancellation payload, and map picker exceptions to a `500` JSON error without leaking process details.

- [ ] **Step 4: Add the typed API client method**

Implement `pickProjectFolder` as a `POST` with no body through the existing `request` helper.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run: `npm test -- service/src/server.test.ts src/lib/api.test.ts`

Expected: PASS with the existing API tests and new endpoint cases.

- [ ] **Step 6: Commit the endpoint and API client**

```text
git add service/src/server.ts service/src/server.test.ts src/lib/api.ts
git commit -m "feat: expose project folder picker endpoint"
```

### Task 3: Replace manual path entry in the React project dialog

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- The dialog exposes a `Choose folder` button with an accessible name.
- The selected path is displayed in a read-only field labelled `Folder path`.
- The project name field is populated from `getProjectNameFromFolderPath` and is read-only.
- Save remains disabled until a folder is selected and while picker/save requests are pending.

- [ ] **Step 1: Update the browser smoke test to assert the new user flow**

Open the dialog, assert the manual path field is read-only and the project name field is read-only, click `Choose folder`, and stub the `/api/projects/pick-folder` response in the test with `C:\\Work\\Founder outreach`. Then save and verify the project and path.

- [ ] **Step 2: Run the focused browser test and confirm it fails against the old UI**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts -g "connects a project"`

Expected: FAIL because `Choose folder` does not exist and the old fields are editable.

- [ ] **Step 3: Implement picker state and dialog UI**

Add `picking` state, call `api.pickProjectFolder`, ignore `{ cancelled: true }`, derive the name on selection, clear stale errors before retrying, and show `Choosing…` while pending. Render the name and path as read-only fields, add `Choose folder` with a folder icon, and disable save until `folderPath` is non-empty.

- [ ] **Step 4: Run the focused browser test and confirm it passes**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts -g "connects a project"`

Expected: PASS.

- [ ] **Step 5: Run the mobile dialog smoke coverage**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts --project=chromium`

Expected: Existing navigation coverage plus the updated project flow pass without horizontal overflow.

- [ ] **Step 6: Commit the UI flow**

```text
git add src/App.tsx tests/e2e/smoke.spec.ts
git commit -m "feat: choose project folders from the native picker"
```

### Task 4: Full verification, review, and integration

**Files:**
- Review: all changed files and `git diff`

- [ ] **Step 1: Run the complete project check**

Run: `npm run check`

Expected: format check, typecheck, lint, unit tests, service build, production build, and Playwright smoke tests all exit successfully.

- [ ] **Step 2: Inspect the final diff and working tree**

Run: `git diff HEAD~3..HEAD --stat; git diff HEAD~3..HEAD --check; git status --short --branch`

Confirm only the folder-picker feature and its tests/docs changed, no secrets or runtime data are included, and the service remains loopback-only.

- [ ] **Step 3: Push the feature commits to the GitHub remote**

Run: `git push origin main`

Expected: the remote `origin/main` advances to the verified local `main`.

- [ ] **Step 4: Confirm the remote branch state**

Run: `git status --short --branch; git log -3 --oneline --decorate`

Expected: the working tree is clean and local `main` matches `origin/main`.
