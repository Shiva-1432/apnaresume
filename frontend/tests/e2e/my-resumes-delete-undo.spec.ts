import { expect, test } from '@playwright/test';

async function clickDeleteUntilUndoAppears(page: import('@playwright/test').Page) {
  const deleteButton = page.getByRole('button', { name: 'Delete resume' }).first();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await deleteButton.click();
    const undoVisible = await page.getByRole('button', { name: 'Undo' }).isVisible();
    if (undoVisible) {
      return;
    }
    await page.waitForTimeout(250);
  }
}

test.describe('My Resumes delete undo flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('resumes');
      window.localStorage.removeItem('my-resumes-trash');
    });
    await page.goto('/my-resumes');
  });

  test('shows undo banner and restores the deleted resume', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Resumes' })).toBeVisible();
    const initialCards = await page.getByRole('button', { name: 'Delete resume' }).count();
    const firstResumeTitle = page.locator('h3, h4, [data-slot="card-title"]').first();
    const deletedName = (await firstResumeTitle.textContent())?.trim() || 'Resume';
    await expect(page.getByText(deletedName)).toBeVisible();

    await clickDeleteUntilUndoAppears(page);

    await expect(page.getByText(/deleted/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(page.getByText(/Undo available for/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete resume' })).toHaveCount(initialCards - 1);

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByText(deletedName)).toBeVisible();
    await expect(page.getByText(/Undo available for/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete resume' })).toHaveCount(initialCards);
  });

  test('finalizes deletion after the timer expires', async ({ page }) => {
    test.setTimeout(70000);
    const initialCards = await page.getByRole('button', { name: 'Delete resume' }).count();

    await clickDeleteUntilUndoAppears(page);

    await expect(page.getByText(/Undo available for/i)).toBeVisible();
    await expect(page.getByText(/Undo available for/i)).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Delete resume' })).toHaveCount(initialCards - 1);
  });
});
