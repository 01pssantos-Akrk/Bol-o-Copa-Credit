# Bolão da Copa Credit Online

Projeto atualizado e pronto para publicar na Vercel com Supabase.

## O que já vem pronto

- Cadastro por CPF, nome, equipe e foto.
- 10 pontos por CPF.
- 1 aposta por CPF.
- Admin com senha `CopaAkrk`.
- Admin pode atualizar resultado, excluir participante e liberar nova aposta.
- Ranking Top 5 com foto.
- Regras resumidas sem mencionar prêmio, apenas os 5 primeiros colocados.
- Jogadores do Brasil e Japão no campo "Jogador do primeiro gol".
- QR Code automático após publicar.
- Visual inspirado nas praias do Rio de Janeiro.

## Como subir para o GitHub pelo navegador

1. Descompacte este ZIP no computador.
2. Abra a pasta descompactada.
3. Entre no seu repositório GitHub.
4. Clique em `uploading an existing file`.
5. Arraste todos os arquivos e pastas de dentro da pasta descompactada.
6. Clique em `Commit changes`.

## Como configurar o Supabase

1. Acesse https://supabase.com
2. Crie um projeto.
3. Abra `supabase_schema.sql`.
4. Copie tudo.
5. No Supabase, vá em SQL Editor.
6. Cole e execute.
7. Vá em Storage.
8. Crie um bucket público chamado `avatars`.

## Variáveis para Vercel

No Supabase:
- Project Settings > API
- Copie:
  - Project URL
  - anon public key

Na Vercel, adicione:

```env
VITE_SUPABASE_URL=cole_aqui_o_project_url
VITE_SUPABASE_ANON_KEY=cole_aqui_a_anon_public_key
VITE_ADMIN_PASSWORD=CopaAkrk
```

## Deploy na Vercel

1. Vá em https://vercel.com/new
2. Importe o repositório do GitHub.
3. Framework Preset: Vite
4. Adicione as variáveis de ambiente.
5. Clique em Deploy.

Depois do deploy, a Vercel vai gerar o link público do app.
