export const Routes = {
  Home: '/',
  NoteDetail: (id: string) => `/notes/${encodeURIComponent(id)}`,
} as const
