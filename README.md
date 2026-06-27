# Bolão da Copa Credit - Versão Universal Corrigida

Esta versão evita o erro anterior da Vercel porque o `index.html` aponta para:

`/main.jsx`

Os arquivos principais estão na raiz:
- main.jsx
- App.jsx
- styles.css

Também existe uma cópia dentro da pasta `src/` como segurança.

## Como substituir no GitHub

1. Extraia este ZIP.
2. No GitHub, envie os arquivos extraídos para o mesmo repositório.
3. Pode substituir os arquivos antigos.
4. Garanta que `index.html`, `main.jsx`, `App.jsx`, `styles.css`, `package.json` e `vite.config.js` estejam na raiz do repositório.
5. Depois clique em Redeploy na Vercel.

## Variáveis da Vercel

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_PASSWORD=CopaAkrk

## Supabase

Execute `supabase_schema.sql` no SQL Editor.
Crie um bucket público chamado `avatars`.
