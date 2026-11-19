# Заметки

SPA для заметок с пунктами Todo. Две страницы: список заметок `/` и редактор `/notes/[id]`. Заметки и черновик хранятся в `localStorage`, незавершённое редактирование восстанавливается после перезагрузки.

Стек: Nuxt 4, Vue 3 Composition API, TypeScript strict, Pinia, Zod, SCSS, Vitest. Без UI-библиотек, библиотек undo/redo и persisted-state плагинов.

## Запуск

Требования: Node.js 20.19+ и pnpm 10.

```bash
pnpm install
pnpm dev
```

Приложение: http://localhost:3000

Через Docker:

```bash
docker compose up --build
```

## Возможности

- Список заметок с read-only превью Todo; создание и удаление с подтверждением.
- Редактор: название, добавление/удаление/редактирование пунктов, отметка выполнения.
- Ручная история на патчах: undo/redo, лимит 50 шагов, слияние непрерывного ввода в одну запись, очистка redo при новом изменении.
- `Ctrl+Z` / `Shift+Ctrl+Z` на странице редактора; внутри текстовых полей работает нативный undo.
- Версионированное хранилище, debounce-запись и flush на `pagehide`.
- Черновик незавершённого редактирования и предложение восстановить его после перезагрузки.
- Обработка несуществующего id, удаления заметки из другой вкладки и обновлений из другой вкладки.
- Собственные модальные окна: Teleport, focus-trap, Escape, возврат фокуса, ARIA, стек диалогов.
- Адаптивная вёрстка.

## Как это работает

### Слои

| Слой | Ответственность |
|---|---|
| `NotesRepository` + Pinia store | Сохранённые заметки: hydrate, CRUD, debounce-запись, reload по `storage` |
| `NoteEditSession` | Одна заметка в редакторе: текущее состояние, патчи, deferred-ввод |
| `History.ts` | `PatchType`, `Patch`, `applyPatch`/`invertPatch`, `NoteHistory`, `DeferredTextCommits` |
| `DraftStorage` | Один катящийся снимок редактируемой заметки |
| `useNotes` / `useNote` | Оркестрация страниц: загрузка, диалоги, hotkeys, жизненный цикл |
| `useDialog` + `DialogHost` | Стек модалок, focus-trap, Escape, возврат фокуса |

Pinia-стор — фасад над `NotesRepository`: хранит `notes`/`hydrated` и делегирует ему операции. Repository не зависит от Vue-рантайма, принимает `Ref`-состояние и `Storage`, поэтому тестируется без монтирования.

### Старт и главная

При создании store repository гидрирует данные из `notes-todo:v1`. Данные проходят Zod-валидацию: неизвестная версия, битый JSON или неверная форма дают пустой список, а не падение.

Главная читает `store.notes`. Создание и удаление заметки пишутся в storage сразу. На `storage`-событие главная делает `reloadFromStorage()`, поэтому изменения из другой вкладки появляются без перезагрузки страницы.

### Открытие редактора

`useNote` находит сохранённую заметку в store, клонирует её и создаёт `NoteEditSession`. Затем проверяет черновик:

- «Восстановить» — новая сессия из черновика, история пустая, есть несохранённые изменения;
- «Отбросить» — черновик удаляется, показывается сохранённая версия;
- Escape, клик по overlay или навигация — черновик **не** удаляется, просто показывается сохранённая версия.

Если заметки нет — показывается состояние «Заметка не найдена».

### Редактирование

**Текст** (название или текст пункта) применяется к заметке сразу, чтобы UI не тормозил, но в историю попадает не сразу. `DeferredTextCommits` хранит один pending-коммит, обновляет `after` и перезапускает таймер 500 мс. Коммит происходит на blur или после паузы, после чего в историю попадает один патч. Для пункта Todo индекс ищется по `id` в момент коммита — пока пользователь печатал, список мог измениться.

**Toggle, добавление и удаление** — атомарные действия. Перед ними вызывается `flushPending()`, чтобы текст попал в историю раньше структурного изменения. Затем патч коммитится и сразу применяется к заметке.

Любое изменение обновляет `note` ref, ставит `hasChanges`, планирует запись черновика и пересчитывает `canUndo`/`canRedo`.

### История

История хранит только обратимые патчи:

| `PatchType` | Поля |
|---|---|
| `Title` | `before`, `after` |
| `TodoAdd` | `index`, `item` |
| `TodoRemove` | `index`, `item` |
| `TodoText` | `index`, `before`, `after` |
| `TodoToggle` | `index`, `before`, `after` |

`NoteHistory` держит `past` и `future`. `commit` игнорирует no-op, кладёт патч в `past`, очищает `future` и удаляет самый старый патч после 50-го. `undo` переносит патч в `future`, сессия применяет `invertPatch`; `redo` возвращает патч обратно. Полных копий заметки в истории нет.

Save создаёт новую сессию, поэтому история обнуляется. Cancel и delete уничтожают сессию. После перезагрузки истории нет — сохраняется только содержимое черновика.

### Сохранение и черновик

Save: `flushPending()` → запись заметки в repository → `flushPending()` записи → новая сессия → очистка черновика.

Черновик пишется через 500 мс после изменений, а также принудительно на `pagehide` и перед unmount. Это один катящийся снимок заметки, а не история и не копия на каждый шаг.

### Другая вкладка

`storage`-событие перечитывает заметки в repository.

- Главная просто обновляет список.
- Редактор без локальных изменений подхватывает remote-версию и начинает историю заново.
- Редактор с несохранёнными изменениями сохраняет локальные правки и показывает баннер «Заметка изменена в другой вкладке» с явной кнопкой загрузки remote-версии.
- Если заметку удалили — показывается модалка и происходит переход на главную.

`updatedAt` используется как дешёвый маркер изменения заметки; версия схемы (`version: 1`) нужна для валидации и будущих миграций.

## Структура

```text
app/
├── utils/                       общие утилиты без домена
│   ├── debouncedWriter.ts       debounce с flush/cancel
│   ├── id.ts                    createId на crypto.randomUUID
│   └── note.ts                  cloneNote, normalizeTitle
├── enums/Routes.ts              Routes.Home, Routes.NoteDetail(id)
├── modules/notes/               вертикальный срез домена
│   ├── types.ts                 Note, TodoItem, версии схемы
│   ├── store.ts                 Pinia: состояние + фасад NotesRepository
│   ├── services/
│   │   ├── Storage.ts           чтение/запись notes-todo:v1
│   │   ├── DraftStorage.ts      черновик notes-todo:draft:v1
│   │   ├── Schemas.ts           Zod-схемы хранилища
│   │   ├── History.ts           PatchType, Patch, NoteHistory, deferred-ввод
│   │   ├── NoteEditSession.ts   createNoteEditSession: патчи и операции с пунктами
│   │   └── NotesRepository.ts   загрузка, CRUD и debounce записи
│   ├── composables/             useNotes, useNote
│   └── components/              NoteCard, CreateNoteDialog, TodoItemRow, TodoComposer, DraftRecoveryDialog
├── components/
│   ├── app/DialogHost.vue       глобальный контейнер модалок
│   └── ui/                      AppModal, ConfirmDialog, AppButton
├── composables/useDialog.ts     generic dialog API
└── pages/                       index.vue, notes/[id].vue
```

## Хранилище

- `notes-todo:v1` — `{ version: 1, notes: Note[] }`.
- `notes-todo:draft:v1` — `{ version: 1, noteId, note, updatedAt }`.

Неизвестная версия, битый JSON и неверная форма игнорируются: приложение стартует с пустым списком.

## Скрипты

| Команда | Назначение |
|---|---|
| `pnpm dev` | dev-сервер Nuxt |
| `pnpm build` | production-сборка |
| `pnpm preview` | preview собранного приложения |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | unit-тесты Vitest |
| `pnpm lint` | ESLint с автоисправлением |
| `pnpm lint:check` | ESLint без изменений |
| `pnpm lint:styles` | Stylelint с автоисправлением |
| `pnpm lint:styles:check` | Stylelint без изменений |

## Тесты

```bash
pnpm test
```

Покрыты: версионированное чтение/запись, битые данные, черновик, debounce и flush, применение/инверсия патчей, лимит истории, undo/redo, очистка redo, слияние ввода, no-op коммиты, repository/store и операции сессии редактирования.
