# Заметки

SPA для заметок с пунктами Todo: Nuxt 4, Vue 3 Composition API, TypeScript strict, Pinia, SCSS, Vitest. Стили проверяются Stylelint (standard-scss, порядок свойств, nesting ≤ 3).

## Возможности

- Две страницы: список заметок `/` и редактор `/notes/[id]`.
- Создание заметки в модалке, удаление с подтверждением.
- Редактирование названия и пунктов Todo: добавление, удаление, изменение текста, отметка выполнения.
- Ручная история изменений на патчах: undo/redo, лимит 50 шагов, слияние непрерывного ввода в одну запись, очистка redo при новом изменении.
- Горячие клавиши `Ctrl+Z` / `Shift+Ctrl+Z` на странице редактора; внутри текстовых полей работает нативный undo.
- Версионированное хранилище в `localStorage` с debounce-записью и flush на `pagehide`.
- Черновик незавершённого редактирования и предложение восстановить его после перезагрузки.
- Обработка несуществующего id и удаления открытой заметки из другой вкладки.
- Собственные модальные окна: focus-trap, Escape, возврат фокуса, ARIA, стек диалогов, анимация закрытия, iOS-safe scroll lock.
- Адаптивная вёрстка для мобильных и десктопных экранов.

Без UI-библиотек, библиотек undo/redo и persisted-state плагинов. Валидация данных из `localStorage` — через Zod.

## Запуск

Требования: Node.js 20.19+ и pnpm 10.

```bash
pnpm install
pnpm dev
```

Приложение: http://localhost:3000

## Скрипты

| Команда | Назначение |
|---|---|
| `pnpm dev` | dev-сервер Nuxt |
| `pnpm build` | production-сборка |
| `pnpm preview` | preview собранного приложения |
| `pnpm typecheck` | `vue-tsc --noEmit` по сгенерированному Nuxt tsconfig |
| `pnpm test` | unit-тесты Vitest |
| `pnpm lint` | ESLint с автоисправлением (Nuxt flat config) |
| `pnpm lint:check` | ESLint без изменений (для CI) |
| `pnpm lint:styles` | Stylelint с автоисправлением SCSS/Vue-стилей |
| `pnpm lint:styles:check` | Stylelint без изменений (для CI) |

## Docker

```bash
docker compose up --build
```

Приложение будет доступно на http://localhost:3000. Образ собирается в два этапа (Node 20 Alpine, pnpm, `.output/server/index.mjs`), runtime работает от пользователя `node`.

## Архитектура

```
app/
├── utils/                       общие утилиты без домена
│   ├── debouncedWriter.ts       debounce с flush/cancel
│   ├── id.ts                    createId на crypto.randomUUID
│   └── note.ts                  cloneNote, normalizeTitle
├── enums/Routes.ts              маршруты: Routes.Home, Routes.NoteDetail(id)
├── modules/notes/               вертикальный срез домена
│   ├── types.ts                 Note, TodoItem, версии схемы
│   ├── store.ts                 Pinia: состояние + фасад NotesRepository
│   ├── services/                чистые модули без Vue-рантайма
│   │   ├── Storage.ts           чтение/запись notes-todo:v1
│   │   ├── DraftStorage.ts      черновик notes-todo:draft:v1
│   │   ├── Schemas.ts           Zod-схемы хранилища
│   │   ├── History.ts           PatchType, Patch, NoteHistory, deferred-ввод
│   │   ├── NoteEditSession.ts   createNoteEditSession: патчи и операции с пунктами
│   │   └── NotesRepository.ts   загрузка, CRUD и debounce записи
│   ├── composables/             useNotes (главная), useNote (редактор)
│   └── components/              NoteCard, CreateNoteDialog, TodoItemRow, TodoComposer, DraftRecoveryDialog
├── components/
│   ├── app/DialogHost.vue       глобальный контейнер модалок
│   └── ui/                      AppModal, ConfirmDialog, AppButton
├── composables/useDialog.ts     generic dialog API
└── pages/                       index.vue, notes/[id].vue
```

Pinia-стор — фасад над `NotesRepository`: хранит `notes`/`hydrated` и делегирует hydrate, CRUD, debounce и reload. Сам repository не зависит от Vue-рантайма, принимает `Ref`-состояние и `Storage`, поэтому тестируется без монтирования. История изменений и черновик принадлежат сессии редактирования, а не глобальному стору: патчи индексируют пункты заметки и не должны переживать переход к другой заметке. Навигация — только `navigateTo(Routes.*)`.

## Хранилище

- `notes-todo:v1` — `{ version: 1, notes: Note[] }`.
- `notes-todo:draft:v1` — одна катящаяся копия редактируемой заметки.

Неизвестная версия, битый JSON и неверная форма игнорируются: приложение стартует с пустым списком и не падает.

## Тесты

```bash
pnpm test
```

Покрыты: версионированное чтение/запись, битые данные, черновик, debounce и flush, применение/инверсия патчей, лимит истории, undo/redo, очистка redo, слияние ввода, пропуск no-op коммитов и операции сессии редактирования.
