# Luxe Kanban

Papan Kanban **mewah & minimalis** — onyx & emas, tipografi serif Cormorant Garamond.
CRUD penuh, **drag & drop** + **dropdown status selector**, penyimpanan **LocalStorage granular**,
dan **backup/restore ZIP ber-tahapan** yang terlihat secara visual.

100% statis (Next.js `output: 'export'`) — siap di-deploy ke **GitHub Pages / Actions**, tanpa backend.

![stack](https://img.shields.io/badge/Next.js-14.2-black) ![node](https://img.shields.io/badge/Node-22%20%7C%2024-339933) ![tests](https://img.shields.io/badge/unit_tests-31%2F31-brightgreen) ![e2e](https://img.shields.io/badge/e2e-19%2F19-brightgreen)

---

## Fitur

| Fitur | Detail |
| --- | --- |
| **3 kolom utama** | Akan Dilakukan · Sedang Dilakukan · Sudah Dilakukan |
| **CRUD per kartu** | Tambah (per kolom), edit (judul/deskripsi/status), hapus dengan konfirmasi |
| **Ubah status, 2 cara** | 1. Drag & drop antar kolom (posisi drop mengikuti kursor) 2. Dropdown status selector di setiap kartu |
| **LocalStorage granular** | Satu store per kolom: `luxekanban.v1.tasks.todo/doing/done` + `luxekanban.meta` — mudah dibackup/dipulihkan per-bagian |
| **Backup ZIP ber-tahapan** | Verifikasi, Validasi data, Memuat data baru (kompres), Selesai — setiap tahap tampil visual, UI **terkunci** selama proses |
| **Restore tervalidasi** | Tanda tangan ZIP, kelengkapan entri, versi skema, struktur tugas, ID duplikat, validitas tanggal — semua diperiksa sebelum data ditulis |
| **Reset papan** | Dengan konfirmasi + saran backup dulu |

## Kebutuhan

- **Node.js 22.23.4 atau 24.x** — rentang versi yang didukung tercatat di `package.json > engines`.
  CI menguji Node.js 22 melalui `actions/setup-node`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

## Quality gates

```bash
npm run verify     # typecheck + unit tests (Vitest) + static build
npm run e2e        # Playwright, desktop + mobile (butuh: npx playwright install chromium)
```

**Penting — basePath:** jika situs dilayani dari subpath (`https://user.github.io/<repo>/`),
workflow membangun dengan `NEXT_PUBLIC_BASE_PATH=/<nama-repo>` (lihat contoh di bawah).
Untuk **custom domain / root**, hapus env tersebut (default: kosong = root).

Contoh penyesuaian workflow (di job `verify`, step *Verify*):

```yaml
      - name: Verify (typecheck + unit tests + static build)
        env:
          NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }} # hapus baris ini untuk custom domain
        run: npm run verify
```

> Ganti `/<nama-repo>` dengan nama repo Anda, atau set `NEXT_PUBLIC_BASE_PATH=` (kosong) bila memakai custom domain.

## Struktur data (LocalStorage)

```
luxekanban.meta              → { lastBackupAt, lastRestoreAt, restoredTaskCount }
luxekanban.v1.tasks.todo     → { version: 1, updatedAt, items: Task[] }
luxekanban.v1.tasks.doing    → { version: 1, updatedAt, items: Task[] }
luxekanban.v1.tasks.done     → { version: 1, updatedAt, items: Task[] }
```

Isi arsip backup ZIP:

```
manifest.json       → { app: 'luxe-kanban', schemaVersion: 1, exportedAt, counts }
tasks-todo.json     → StoreFile<Task>
tasks-doing.json    → StoreFile<Task>
tasks-done.json     → StoreFile<Task>
```

Struktur ZIP **identik** dengan store granular — backup bisa dibaca/diedit manual lalu di-restore kembali.

## Arsitektur

```
app/
  App.tsx              # shell aplikasi: state papan, CRUD, DnD, operasi
  ui/                  # komponen presentasional (TaskCard, Column, Modal, StepsView…)
  ui/Icons.tsx         # semua ikon: SVG inline stroke 1.7px — tanpa emoji
  layout.tsx           # font self-hosted (next/font) + metadata
lib/
  types.ts             # Status, Task, STATUS_META
  board.ts             # operasi papan murni & immutable (add/update/delete/move)
  storage.ts           # store granular LocalStorage + migrasi/seed
  backup.ts            # build/unzip/validate ZIP (fflate)
  backupService.ts     # orkestrasi tahapan backup/restore
  steps.ts             # model tahapan operasi
  utils.ts             # helper kecil
tests/
  *.test.ts            # unit (Vitest) — domain layer
  e2e/app.spec.ts      # E2E (Playwright) — against production build di out/
```

## Batasan yang diketahui

- LocalStorage per-browser/per-origin: data tidak tersinkron antar perangkat — gunakan Backup/Restore ZIP untuk memindahkan.
- GitHub Pages tidak mendukung custom headers (CSP dsb.) — aplikasi tidak meminta permission khusus, data tidak pernah keluar dari browser.
- Drag & drop memakai HTML5 DnD native; pada perangkat sentuh tanpa emulasi mouse, gunakan dropdown status selector.

## Lisensi

MIT — © Babel von Britton
