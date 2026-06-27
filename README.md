# Bolão da Copa Credit - FINAL SEM APP.JSX

Esta versão elimina a causa da tela azul:

- Todo o app está dentro de `src/main.jsx`.
- Não existe dependência de `App.jsx`.
- `index.html` aponta diretamente para `/src/main.jsx`.
- Se abrir somente tela azul, o GitHub/Vercel ainda está usando arquivos antigos.

## Como aplicar

1. No GitHub, exclua arquivos soltos antigos da raiz:
   - App.jsx
   - main.jsx
   - styles.css

2. Mantenha/envie a estrutura deste ZIP:
   - package.json
   - vite.config.js
   - index.html
   - src/main.jsx
   - src/styles.css
   - public/manifest.json
   - supabase_schema.sql

3. Faça commit.

4. Na Vercel:
   - Deployments
   - Redeploy
   - se aparecer, use Clear Build Cache / sem cache.

## Variáveis da Vercel

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_PASSWORD=CopaAkrk

## Supabase

Execute `supabase_schema.sql`.
Crie bucket público `avatars`.
