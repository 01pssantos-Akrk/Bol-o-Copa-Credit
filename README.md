# Bolão da Copa Credit - Projeto Final

Estrutura correta para Vercel + Vite + Supabase.

## Arquivos principais

- package.json
- vite.config.js
- index.html
- src/main.jsx
- src/App.jsx
- src/styles.css
- public/manifest.json
- supabase_schema.sql

## Como atualizar o GitHub corretamente

1. No GitHub, apague o conteúdo antigo do repositório ou substitua tudo.
2. Extraia este ZIP.
3. Envie todos os arquivos e pastas extraídos para a raiz do repositório.
4. A estrutura final precisa ficar assim:

package.json
vite.config.js
index.html
src/
public/
supabase_schema.sql
README.md

5. Na Vercel, faça Redeploy.

## Variáveis na Vercel

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_PASSWORD=CopaAkrk

## Supabase

Execute o arquivo supabase_schema.sql no SQL Editor.
Crie um bucket público chamado avatars.
