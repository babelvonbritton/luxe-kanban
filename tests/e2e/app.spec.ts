import { expect, Page, test } from '@playwright/test';
import * as fflate from 'fflate';
import * as fs from 'node:fs';

async function cleanBoard(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.column')).toHaveCount(3);
}

const modal = (page: Page) => page.locator('.modal');

test('render awal: seed 2/2/2 + store granular', async ({ page }) => {
  await cleanBoard(page);
  await expect(page.locator('.count-badge')).toHaveText(['2', '2', '2']);
  await expect(page.locator('.brand-sub')).toContainText('6 tugas');
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('luxekanban')).sort(),
  );
  expect(keys).toEqual([
    'luxekanban.meta',
    'luxekanban.v1.tasks.doing',
    'luxekanban.v1.tasks.done',
    'luxekanban.v1.tasks.todo',
  ]);
});

test('validasi: judul kosong ditolak', async ({ page }) => {
  await cleanBoard(page);
  await page.locator('.column').first().locator('.column-foot .btn').click();
  await page.locator('#task-title').fill('   ');
  await modal(page).locator('.modal-foot .btn.primary').click();
  await expect(page.locator('.field .error')).toContainText('wajib');
  await modal(page).locator('.modal-foot .btn.subtle').click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('CRUD: create → persist → edit → delete', async ({ page }) => {
  await cleanBoard(page);

  // CREATE
  await page.locator('.column').first().locator('.column-foot .btn').click();
  await page.locator('#task-title').fill('Uji Coba Luxury');
  await page.locator('#task-desc').fill('Deskripsi uji');
  await modal(page).locator('.modal-foot .btn.primary').click();
  const newCard = page.locator('.column').first().locator('.task-card').first();
  await expect(newCard).toContainText('Uji Coba Luxury');
  await expect(page.locator('.count-badge').first()).toHaveText('3');
  const items = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.todo') as string).items,
  );
  expect(items.some((t: { title: string }) => t.title === 'Uji Coba Luxury')).toBe(true);

  // EDIT
  await newCard.locator('.icon-btn[title="Edit"]').click();
  await page.locator('#task-title').fill('Uji Coba Diedit');
  await modal(page).locator('.modal-foot .btn.primary').click();
  await expect(page.locator('.column').first()).toContainText('Uji Coba Diedit');
  const items2 = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.todo') as string).items,
  );
  expect(items2.find((t: { title: string }) => t.title === 'Uji Coba Diedit')).toBeTruthy();

  // DELETE (dengan konfirmasi)
  const card = page.locator('.task-card', { hasText: 'Uji Coba Diedit' }).first();
  await card.locator('.icon-btn.danger').click();
  await modal(page).locator('.modal-foot .btn.danger').click();
  await expect(page.locator('.column').first()).not.toContainText('Uji Coba Diedit');
  const items3 = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.todo') as string).items,
  );
  expect(items3.some((t: { title: string }) => t.title === 'Uji Coba Diedit')).toBe(false);
});

test('tombol Ganti status memindahkan kartu antar kolom', async ({ page }) => {
  await cleanBoard(page);
  const card = page.locator('.column').nth(0).locator('.task-card').first();
  const title = (await card.locator('.task-title').textContent()) as string;
  await card.locator('.status-switcher summary').click();
  await card.getByRole('button', { name: 'Sedang Dilakukan' }).click();
  const target = page.locator('.column').nth(1).locator('.task-card', { hasText: title });
  await expect(target).toHaveCount(1);
  await expect(target.locator('.status-switcher summary')).toHaveText('Ganti status');
  const doing = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.doing') as string).items.map((t: { title: string }) => t.title),
  );
  expect(doing).toContain(title);
  const todo = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.todo') as string).items.map((t: { title: string }) => t.title),
  );
  expect(todo).not.toContain(title);
});

async function html5DragAndDrop(page: Page, source: string, target: string) {
  await page.evaluate(([s, t]) => {
    const src = document.querySelector(s) as HTMLElement;
    const tgt = document.querySelector(t) as HTMLElement;
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    tgt.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    tgt.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    src.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, [source, target]);
}

test('drag & drop kartu dari Akan ke Sudah Dilakukan', async ({ page }) => {
  await cleanBoard(page);
  const firstCard = page.locator('.column').nth(0).locator('.task-card').first();
  const title = (await firstCard.locator('.task-title').textContent()) as string;
  await expect(page.locator('.column').nth(2).locator('.task-card', { hasText: title })).toHaveCount(0);

  await html5DragAndDrop(
    page,
    `.column:nth-of-type(1) .task-card:first-child`,
    `.column:nth-of-type(3)`,
  );

  const dropped = page.locator('.column').nth(2).locator('.task-card', { hasText: title });
  await expect(dropped).toHaveCount(1);
  await expect(page.locator('.column').nth(2).locator('.task-card', { hasText: title })).toHaveCount(1);
  const done = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('luxekanban.v1.tasks.done') as string).items.map((t: { title: string }) => t.title),
  );
  expect(done).toContain(title);
});

test('backup ZIP: tahapan visual berurutan + unduhan ZIP valid', async ({ page }) => {
  await cleanBoard(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.topbar button', { hasText: 'Backup ZIP' }).click();

  const m = modal(page);
  await expect(m).toContainText('Backup Data');
  // tahap verifikasi aktif lebih dulu
  await expect(m.locator('.step').first()).toContainText('Verifikasi');
  // semua tahap selesai
  await expect(m.locator('.step', { hasText: 'Verifikasi arsip' })).toHaveClass(/done/, { timeout: 10_000 });
  await expect(m.locator('.step', { hasText: 'Validasi data' })).toHaveClass(/done/);
  await expect(m.locator('.step', { hasText: 'Memuat data baru' })).toHaveClass(/done/);
  await expect(m.locator('.step', { hasText: 'Merapikan status' })).toHaveClass(/done/);

  const dl = await downloadPromise;
  expect(dl.suggestedFilename()).toMatch(/^luxekanban-backup-\d{4}-\d{2}-\d{2}T.*\.zip$/);
  const filePath = await dl.path();
  const head = fs.readFileSync(filePath as string).subarray(0, 4);
  expect(Array.from(head)).toEqual([0x50, 0x4b, 0x03, 0x04]); // signature "PK\x03\x04"

  await m.locator('button:has-text("Selesai")').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const meta = await page.evaluate(() => JSON.parse(localStorage.getItem('luxekanban.meta') as string));
  expect(meta.lastBackupAt).toBeTruthy();
});

test('restore file bukan-ZIP: gagal di tahap verifikasi, data utuh', async ({ page }) => {
  await cleanBoard(page);
  await page.setInputFiles('input[type=file]', {
    name: 'rusak.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('ini bukan arsip zip'),
  });
  await modal(page).locator('.modal-foot .btn.danger').click(); // "Muat Backup"
  const m = modal(page);
  await expect(m.locator('.step', { hasText: 'Verifikasi arsip' })).toHaveClass(/error/, { timeout: 10_000 });
  await expect(m).toContainText('Operasi dihentikan');
  // data tidak berubah
  await expect(page.locator('.count-badge')).toHaveText(['2', '2', '2']);
  await m.locator('button:has-text("Tutup")').click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('restore backup valid: roundtrip penuh', async ({ page }) => {
  await cleanBoard(page);
  const now = new Date().toISOString();
  const zip = fflate.zipSync({
    'manifest.json': fflate.strToU8(
      JSON.stringify({ app: 'luxe-kanban', schemaVersion: 1, exportedAt: now, counts: { todo: 1, doing: 0, done: 0, total: 1 } }),
    ),
    'tasks-todo.json': fflate.strToU8(
      JSON.stringify({
        version: 1,
        updatedAt: now,
        items: [
          { id: 'r1', title: 'Restore Target', description: 'dari backup', status: 'todo', createdAt: now, updatedAt: now },
        ],
      }),
    ),
    'tasks-doing.json': fflate.strToU8(JSON.stringify({ version: 1, updatedAt: now, items: [] })),
    'tasks-done.json': fflate.strToU8(JSON.stringify({ version: 1, updatedAt: now, items: [] })),
  });

  await page.setInputFiles('input[type=file]', {
    name: 'backup.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from(zip),
  });
  await modal(page).locator('.modal-foot .btn.danger').click();
  const m = modal(page);
  await expect(m.locator('.step', { hasText: 'Verifikasi arsip' })).toHaveClass(/done/, { timeout: 10_000 });
  await expect(m.locator('.step', { hasText: 'Validasi data' })).toHaveClass(/done/);
  await expect(m.locator('.step', { hasText: 'Memuat data baru' })).toHaveClass(/done/);
  await expect(m.locator('.step', { hasText: 'Restore selesai' })).toHaveClass(/done/);
  await m.locator('button:has-text("Selesai")').click();

  // Board kini berisi tepat 1 kartu dari backup (seed tertimpa)
  await expect(page.locator('.task-card')).toHaveCount(1);
  await expect(page.locator('.task-title', { hasText: 'Restore Target' })).toHaveCount(1);
  await expect(page.locator('.count-badge')).toHaveText(['1', '0', '0']);
});

test('reset papan mengosongkan semua kolom', async ({ page }) => {
  await cleanBoard(page);
  await page.locator('.topbar button', { hasText: 'Reset' }).click();
  await modal(page).locator('.modal-foot .btn.danger').click();
  await expect(page.locator('.count-badge')).toHaveText(['0', '0', '0']);
  const counts = await page.evaluate(() =>
    ['todo', 'doing', 'done'].map((s) =>
      JSON.parse(localStorage.getItem(`luxekanban.v1.tasks.${s}`) as string).items.length,
    ),
  );
  expect(counts).toEqual([0, 0, 0]);
});

test('mobile: kolom tersusun vertikal', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'Hanya relevan di viewport mobile');
  await cleanBoard(page);
  const first = await page.locator('.column').nth(0).boundingBox();
  const second = await page.locator('.column').nth(1).boundingBox();
  expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 5);
});
