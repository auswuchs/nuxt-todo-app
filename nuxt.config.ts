import { fileURLToPath } from 'node:url'

const appDir = fileURLToPath(new URL('./app', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  experimental: {
    viteEnvironmentApi: true,
  },
  alias: {
    '~': appDir,
    '@': appDir,
  },
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  imports: {
    dirs: ['modules/**/composables', 'modules/**/services'],
  },
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/app', pathPrefix: false },
    { path: '~/modules/notes/components', pathPrefix: false },
  ],
  css: ['~/assets/scss/main.scss'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'Заметки',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SPA для заметок с пунктами Todo' },
      ],
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/variables" as *;\n@use "@/assets/scss/mixins" as *;\n',
        },
      },
    },
  },
})
