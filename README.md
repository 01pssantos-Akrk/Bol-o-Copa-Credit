# Bol-o-Copa-Credit corrigido

Este ZIP corrige o erro da Vercel:

`Failed to resolve /src/main.jsx from /index.html`

Agora o projeto possui:

- `index.html`
- `src/main.jsx`
- `src/styles.css`
- `package.json`
- `vite.config.js`
- `supabase_schema.sql`

## Como corrigir no GitHub

1. Baixe este ZIP.
2. Descompacte.
3. Abra a pasta descompactada.
4. No seu repositório GitHub, apague os arquivos antigos ou envie estes arquivos por cima.
5. O importante é que a raiz do repositório tenha:
   - package.json
   - index.html
   - vite.config.js
   - src/main.jsx
   - src/styles.css

## Variáveis na Vercel

Mantenha estas três variáveis:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_PASSWORD=CopaAkrk

## Supabase

Execute o arquivo `supabase_schema.sql` no SQL Editor do Supabase.

No Storage, crie um bucket público chamado:

`avatars`
