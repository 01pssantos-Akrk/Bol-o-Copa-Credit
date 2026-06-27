
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'CopaAkrk'

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

const INITIAL_POINTS = 10

const TEAMS = [
  'Praia de Itaipu',
  'Praia do Flamengo',
  'Praia do Arpoador',
  'Praia de Ipanema',
  'Praia do Forte',
  'Operacional'
]

const PLAYERS = [
  'Nenhum',
  'Brasil - Alisson',
  'Brasil - Ederson',
  'Brasil - Gabriel Magalhães',
  'Brasil - Marquinhos',
  'Brasil - Casemiro',
  'Brasil - Alex Sandro',
  'Brasil - Vinícius Júnior',
  'Brasil - Bruno Guimarães',
  'Brasil - Matheus Cunha',
  'Brasil - Neymar',
  'Brasil - Raphinha',
  'Brasil - Weverton',
  'Brasil - Danilo',
  'Brasil - Bremer',
  'Brasil - Léo Pereira',
  'Brasil - Douglas Santos',
  'Brasil - Fabinho',
  'Brasil - Danilo Santos',
  'Brasil - Endrick',
  'Brasil - Lucas Paquetá',
  'Brasil - Luiz Henrique',
  'Brasil - Gabriel Martinelli',
  'Brasil - Ibañez',
  'Brasil - Igor Thiago',
  'Brasil - Rayan',
  'Japão - Zion Suzuki',
  'Japão - Yuto Nagatomo',
  'Japão - Shogo Taniguchi',
  'Japão - Ko Itakura',
  'Japão - Wataru Endo',
  'Japão - Hidemasa Morita',
  'Japão - Ao Tanaka',
  'Japão - Takefusa Kubo',
  'Japão - Ayase Ueda',
  'Japão - Reo Hatate',
  'Japão - Daizen Maeda',
  'Japão - Keisuke Osako',
  'Japão - Yukinari Sugawara',
  'Japão - Junya Ito',
  'Japão - Daichi Kamada',
  'Japão - Koki Machida',
  'Japão - Yuki Ohashi',
  'Japão - Keito Nakamura',
  'Japão - Kota Takai',
  'Japão - Ayumu Seko',
  'Japão - Hiroki Ito',
  'Japão - Takehiro Tomiyasu',
  'Japão - Tomoki Hayakawa',
  'Japão - Ryotaro Araki',
  'Japão - Junnosuke Suzuki',
  'Japão - Shuto Machino'
]

function onlyNumbers(value) {
  return String(value || '').replace(/\D/g, '')
}

function fmt(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function avatar(name) {
  const initial = (name || '?').trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="#10233d"/><text x="50" y="60" font-size="36" text-anchor="middle" fill="#f5c542">${initial}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

function mult(type, value) {
  if (type === 'resultado') {
    if (value === 'Brasil') return 1.25
    if (value === 'Empate') return 2.5
    if (value === 'Japão') return 3.2
  }

  if (type === 'placar') return 5
  if (type === 'gol') return value === 'Nenhum' ? 4 : 3
  return 1
}

function maxPossible(bet) {
  return (
    Number(bet.result_points || 0) * 1 * mult('resultado', bet.result_pick) +
    Number(bet.score_points || 0) * 2 * mult('placar') +
    Number(bet.player_points || 0) * 3 * mult('gol', bet.first_goal_player)
  )
}

function calcScore(bet, official) {
  let score = 0
  const details = []

  if (bet.result_pick === official.result) {
    const pts = Number(bet.result_points || 0) * 1 * mult('resultado', bet.result_pick)
    score += pts
    details.push('resultado +' + fmt(pts))
  }

  if (
    Number(bet.brazil_score) === Number(official.brazil_score) &&
    Number(bet.japan_score) === Number(official.japan_score)
  ) {
    const pts = Number(bet.score_points || 0) * 2 * mult('placar')
    score += pts
    details.push('placar +' + fmt(pts))
  }

  if (normalize(bet.first_goal_player) === normalize(official.first_goal_player)) {
    const pts = Number(bet.player_points || 0) * 3 * mult('gol', bet.first_goal_player)
    score += pts
    details.push('1º gol +' + fmt(pts))
  }

  return {
    score,
    details: details.join(', ') || 'sem acerto'
  }
}

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('bcc_role') || '')
  const [cpfAtual, setCpfAtual] = useState(localStorage.getItem('bcc_cpf') || '')
  const [adminPass, setAdminPass] = useState('')
  const [loading, setLoading] = useState(false)

  const [participants, setParticipants] = useState([])
  const [bets, setBets] = useState([])
  const [official, setOfficial] = useState({
    result: 'Empate',
    brazil_score: 0,
    japan_score: 0,
    first_goal_player: 'Nenhum'
  })

  const [participantForm, setParticipantForm] = useState({
    cpf: '',
    full_name: '',
    team_name: TEAMS[0],
    photo: null
  })

  const [betForm, setBetForm] = useState({
    result_pick: 'Brasil',
    brazil_score: 2,
    japan_score: 0,
    first_goal_player: 'Brasil - Vinícius Júnior',
    result_points: 4,
    score_points: 3,
    player_points: 3
  })

  async function loadData() {
    if (!supabase) return

    const [p, b, r] = await Promise.all([
      supabase.from('participants').select('*').order('created_at', { ascending: false }),
      supabase.from('bets').select('*').order('created_at', { ascending: false }),
      supabase.from('game_result').select('*').eq('id', 1).single()
    ])

    if (p.data) setParticipants(p.data)
    if (b.data) setBets(b.data)
    if (r.data) setOfficial(r.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    const channel = supabase
      .channel('bolao-copa-credit-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_result' }, loadData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const participant = participants.find((p) => p.cpf === cpfAtual)
  const myBet = bets.find((b) => b.cpf === cpfAtual)

  function participantPoints(p) {
    const bet = bets.find((b) => b.cpf === p.cpf)

    if (!bet) return INITIAL_POINTS

    const score = calcScore(bet, official)
    return INITIAL_POINTS - Number(bet.total_allocated || 0) + score.score
  }

  const ranking = useMemo(() => {
    return participants
      .map((p) => ({ ...p, points: participantPoints(p) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
  }, [participants, bets, official])

  function setAllocation(field, value) {
    const next = { ...betForm, [field]: Math.max(0, Number(value) || 0) }

    let result = Number(next.result_points || 0)
    let score = Number(next.score_points || 0)
    let goal = Number(next.player_points || 0)

    if (field === 'result_points') {
      if (result > INITIAL_POINTS) result = INITIAL_POINTS
      if (score > INITIAL_POINTS - result) score = INITIAL_POINTS - result
      if (goal > INITIAL_POINTS - result - score) goal = INITIAL_POINTS - result - score
    }

    if (field === 'score_points') {
      if (score > INITIAL_POINTS - result) score = INITIAL_POINTS - result
      if (goal > INITIAL_POINTS - result - score) goal = INITIAL_POINTS - result - score
    }

    if (field === 'player_points') {
      if (goal > INITIAL_POINTS - result - score) goal = INITIAL_POINTS - result - score
    }

    setBetForm({
      ...next,
      result_points: result,
      score_points: score,
      player_points: goal
    })
  }

  async function uploadPhoto(cpf, file) {
    if (!file || !supabase) return null

    const extension = file.name.split('.').pop() || 'jpg'
    const path = `${cpf}-${Date.now()}.${extension}`

    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upload.error) {
      console.error(upload.error)
      return null
    }

    const publicUrl = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl.data.publicUrl
  }

  async function enterParticipant() {
    try {
      setLoading(true)

      if (!supabase) {
        throw new Error('Supabase não configurado. Confira as variáveis da Vercel.')
      }

      const cpf = onlyNumbers(participantForm.cpf)

      if (cpf.length !== 11) throw new Error('CPF precisa ter 11 números.')
      if (participantForm.full_name.trim().length < 3) throw new Error('Informe o nome completo.')

      const photoUrl = await uploadPhoto(cpf, participantForm.photo)
      const exists = participants.find((p) => p.cpf === cpf)

      if (exists) {
        const payload = {
          full_name: participantForm.full_name.trim(),
          team_name: participantForm.team_name
        }

        if (photoUrl) payload.photo_url = photoUrl

        const response = await supabase.from('participants').update(payload).eq('cpf', cpf)
        if (response.error) throw response.error
      } else {
        const response = await supabase.from('participants').insert({
          cpf,
          full_name: participantForm.full_name.trim(),
          team_name: participantForm.team_name,
          photo_url: photoUrl
        })

        if (response.error) throw response.error
      }

      localStorage.setItem('bcc_role', 'participant')
      localStorage.setItem('bcc_cpf', cpf)
      setCpfAtual(cpf)
      setRole('participant')
      await loadData()
    } catch (error) {
      alert(error.message || 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  function enterAdmin() {
    if (adminPass !== ADMIN_PASSWORD) {
      alert('Senha inválida.')
      return
    }

    localStorage.setItem('bcc_role', 'admin')
    localStorage.removeItem('bcc_cpf')
    setCpfAtual('')
    setRole('admin')
  }

  function logout() {
    localStorage.removeItem('bcc_role')
    localStorage.removeItem('bcc_cpf')
    setCpfAtual('')
    setRole('')
  }

  async function saveBet() {
    try {
      setLoading(true)

      if (!supabase) throw new Error('Supabase não configurado.')
      if (!participant) throw new Error('Faça o cadastro antes de apostar.')
      if (myBet) throw new Error('Este CPF já possui aposta. Apenas o Admin pode liberar nova aposta.')

      const total =
        Number(betForm.result_points || 0) +
        Number(betForm.score_points || 0) +
        Number(betForm.player_points || 0)

      if (total <= 0) throw new Error('Distribua seus pontos.')
      if (total > INITIAL_POINTS) throw new Error('A soma não pode passar de 10 pontos.')

      const payload = {
        cpf: participant.cpf,
        result_pick: betForm.result_pick,
        brazil_score: Number(betForm.brazil_score || 0),
        japan_score: Number(betForm.japan_score || 0),
        first_goal_player: betForm.first_goal_player,
        result_points: Number(betForm.result_points || 0),
        score_points: Number(betForm.score_points || 0),
        player_points: Number(betForm.player_points || 0),
        total_allocated: total,
        max_possible: maxPossible(betForm)
      }

      const response = await supabase.from('bets').insert(payload)
      if (response.error) throw response.error

      alert('Aposta confirmada.')
      await loadData()
    } catch (error) {
      alert(error.message || 'Erro ao confirmar aposta.')
    } finally {
      setLoading(false)
    }
  }

  async function updateOfficial() {
    try {
      setLoading(true)

      if (!supabase) throw new Error('Supabase não configurado.')

      const response = await supabase
        .from('game_result')
        .update({
          result: official.result,
          brazil_score: Number(official.brazil_score || 0),
          japan_score: Number(official.japan_score || 0),
          first_goal_player: official.first_goal_player,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (response.error) throw response.error

      alert('Resultado atualizado.')
      await loadData()
    } catch (error) {
      alert(error.message || 'Erro ao atualizar resultado.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteParticipant(cpf) {
    if (!confirm('Excluir participante e aposta vinculada?')) return

    const response = await supabase.from('participants').delete().eq('cpf', cpf)
    if (response.error) alert(response.error.message)

    await loadData()
  }

  async function releaseBet(cpf) {
    if (!confirm('Excluir aposta e liberar nova aposta para este CPF?')) return

    const response = await supabase.from('bets').delete().eq('cpf', cpf)
    if (response.error) alert(response.error.message)

    await loadData()
  }

  function Ranking() {
    const medals = ['🥇', '🥈', '🥉', '🏅', '🏅']

    return (
      <div>
        {ranking.length === 0 && <p>Nenhum participante cadastrado.</p>}

        {ranking.map((p, index) => (
          <div className="row" key={p.cpf}>
            <div className="personLine">
              <span className="medal">{medals[index]}</span>
              <img className="avatarSmall" src={p.photo_url || avatar(p.full_name)} alt="" />
              <div>
                <strong>{index + 1}. {p.full_name}</strong>
                <br />
                <small>{p.team_name}</small>
              </div>
            </div>

            <div className="badge">{fmt(p.points)} pts</div>
          </div>
        ))}
      </div>
    )
  }

  const totalAllocated =
    Number(betForm.result_points || 0) +
    Number(betForm.score_points || 0) +
    Number(betForm.player_points || 0)

  const remaining = INITIAL_POINTS - totalAllocated

  if (!role) {
    return (
      <main className="shell">
        <header className="hero">
          <div>
            <p className="tag">Credit RMA apresenta</p>
            <h1>🏆 Bolão da Copa Credit</h1>
            <p>Brasil x Japão • 10 pontos por CPF • Ranking Top 5</p>
          </div>
        </header>

        {!supabase && (
          <div className="warning">
            Configure as variáveis da Vercel: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </div>
        )}

        <section className="card loginCard">
          <h2>Entrar como apostador</h2>

          <label>CPF</label>
          <input
            value={participantForm.cpf}
            onChange={(event) => setParticipantForm({ ...participantForm, cpf: event.target.value })}
            placeholder="Somente números"
            inputMode="numeric"
          />

          <label>Nome completo</label>
          <input
            value={participantForm.full_name}
            onChange={(event) => setParticipantForm({ ...participantForm, full_name: event.target.value })}
            placeholder="Nome do participante"
          />

          <label>Equipe</label>
          <select
            value={participantForm.team_name}
            onChange={(event) => setParticipantForm({ ...participantForm, team_name: event.target.value })}
          >
            {TEAMS.map((team) => (
              <option key={team}>{team}</option>
            ))}
          </select>

          <label>Foto do apostador</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setParticipantForm({ ...participantForm, photo: event.target.files?.[0] || null })}
          />

          <button disabled={loading || !supabase} onClick={enterParticipant}>
            Entrar no Bolão
          </button>

          <hr />

          <h2>Administrador</h2>

          <label>Senha Admin</label>
          <input
            type="password"
            value={adminPass}
            onChange={(event) => setAdminPass(event.target.value)}
            placeholder="Senha"
          />

          <button className="dark" onClick={enterAdmin}>
            Acessar Painel Admin
          </button>
        </section>
      </main>
    )
  }

  if (role === 'admin') {
    return (
      <main className="shell">
        <div className="top">
          <div>
            <h1>🏆 Bolão da Copa Credit</h1>
            <p>Painel do Administrador</p>
          </div>

          <button className="ghost" onClick={logout}>
            Sair
          </button>
        </div>

        <div className="kpi">
          <div className="card">
            <p>Participantes</p>
            <strong>{participants.length}</strong>
          </div>

          <div className="card">
            <p>Apostas</p>
            <strong>{bets.length}</strong>
          </div>

          <div className="card">
            <p>Sem aposta</p>
            <strong>{participants.length - bets.length}</strong>
          </div>

          <div className="card">
            <p>Regra</p>
            <strong>10 pts</strong>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <h2>⚙️ Resultado / Controle</h2>

            <label>Resultado</label>
            <select
              value={official.result}
              onChange={(event) => setOfficial({ ...official, result: event.target.value })}
            >
              <option>Brasil</option>
              <option>Empate</option>
              <option>Japão</option>
            </select>

            <label>Placar</label>
            <div className="score">
              <input
                type="number"
                min="0"
                value={official.brazil_score}
                onChange={(event) => setOfficial({ ...official, brazil_score: event.target.value })}
              />
              <span>x</span>
              <input
                type="number"
                min="0"
                value={official.japan_score}
                onChange={(event) => setOfficial({ ...official, japan_score: event.target.value })}
              />
            </div>

            <label>Jogador do primeiro gol</label>
            <select
              value={official.first_goal_player}
              onChange={(event) => setOfficial({ ...official, first_goal_player: event.target.value })}
            >
              {PLAYERS.map((player) => (
                <option key={player}>{player}</option>
              ))}
            </select>

            <button disabled={loading} onClick={updateOfficial}>
              Atualizar ranking
            </button>
          </div>

          <div className="card">
            <h2>📌 Regras Resumidas</h2>
            <div className="rules">
              Cada cadastro recebe <strong>10 pontos</strong>.<br />
              Aposta única por <strong>CPF</strong>.<br /><br />
              Resultado: <strong>peso 1</strong><br />
              Placar exato: <strong>peso 2</strong><br />
              Primeiro gol: <strong>peso 3</strong><br /><br />
              Os <strong>5 primeiros colocados</strong> compõem o ranking final.
            </div>
          </div>

          <div className="card">
            <h2>📲 QR Code</h2>
            <p className="small">Use este QR Code para divulgar o app.</p>
            <img
              className="qr"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(window.location.href)}`}
              alt="QR Code"
            />
            <p className="small break">{window.location.href}</p>
          </div>

          <div className="card wide">
            <h2>🏆 Ranking Top 5</h2>
            <Ranking />
          </div>

          <div className="card wide">
            <h2>📋 Controle dos cadastros</h2>

            {participants.length === 0 && <p>Nenhum cadastro.</p>}

            {participants.map((p) => {
              const hasBet = bets.some((b) => b.cpf === p.cpf)

              return (
                <div className="row" key={p.cpf}>
                  <div className="personLine">
                    <img className="avatarSmall" src={p.photo_url || avatar(p.full_name)} alt="" />
                    <div>
                      <strong>{p.full_name}</strong>
                      <br />
                      <small>{p.team_name} • CPF {p.cpf} • {hasBet ? '✅ apostou' : '❌ sem aposta'}</small>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="danger" onClick={() => deleteParticipant(p.cpf)}>
                      Excluir
                    </button>

                    {hasBet && (
                      <button className="green" onClick={() => releaseBet(p.cpf)}>
                        Liberar nova aposta
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card wide">
            <h2>🧾 Controle das apostas</h2>

            {bets.length === 0 && <p>Nenhuma aposta.</p>}

            {bets.map((b) => {
              const p = participants.find((participantItem) => participantItem.cpf === b.cpf)
              const score = calcScore(b, official)

              return (
                <div className="row" key={b.cpf}>
                  <div>
                    <strong>{p?.full_name || b.cpf}</strong>
                    <br />
                    <small>
                      {b.result_pick}: {fmt(b.result_points)} • Placar {b.brazil_score}x{b.japan_score}: {fmt(b.score_points)} • 1º gol {b.first_goal_player}: {fmt(b.player_points)}
                    </small>
                    <br />
                    <small>
                      Total {fmt(b.total_allocated)}/10 • Possibilidade {fmt(b.max_possible)} pts • {score.details}
                    </small>
                  </div>

                  <div className="badge">{fmt(score.score)} pts</div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="shell">
      <div className="top">
        <div>
          <h1>🏆 Bolão da Copa Credit</h1>
          <p>10 pontos por CPF • 1 aposta por CPF</p>
        </div>

        <button className="ghost" onClick={logout}>
          Sair
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Olá, {participant?.full_name?.split(' ')[0] || 'participante'}</h2>

          <div className="profileRow">
            <img className="avatar" src={participant?.photo_url || avatar(participant?.full_name)} alt="" />

            <div>
              <p>{participant?.team_name}</p>
              <div className="badge">{fmt(participant ? participantPoints(participant) : INITIAL_POINTS)} pts</div>
            </div>
          </div>

          <div className="notice small">
            Só é válida <strong>1 aposta por CPF</strong>. Após confirmar, apenas o Admin pode liberar alteração.
          </div>
        </div>

        <div className="card">
          <h2>⚽ Palpite Brasil x Japão</h2>

          <label>Resultado</label>
          <select
            value={betForm.result_pick}
            onChange={(event) => setBetForm({ ...betForm, result_pick: event.target.value })}
          >
            <option>Brasil</option>
            <option>Empate</option>
            <option>Japão</option>
          </select>

          <label>Pontos no resultado</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={betForm.result_points}
            onChange={(event) => setAllocation('result_points', event.target.value)}
          />

          <label>Placar exato</label>
          <div className="score">
            <input
              type="number"
              min="0"
              value={betForm.brazil_score}
              onChange={(event) => setBetForm({ ...betForm, brazil_score: event.target.value })}
            />
            <span>x</span>
            <input
              type="number"
              min="0"
              value={betForm.japan_score}
              onChange={(event) => setBetForm({ ...betForm, japan_score: event.target.value })}
            />
          </div>

          <label>Pontos no placar</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={betForm.score_points}
            onChange={(event) => setAllocation('score_points', event.target.value)}
          />

          <label>Jogador do primeiro gol</label>
          <select
            value={betForm.first_goal_player}
            onChange={(event) => setBetForm({ ...betForm, first_goal_player: event.target.value })}
          >
            {PLAYERS.map((player) => (
              <option key={player}>{player}</option>
            ))}
          </select>

          <label>Pontos no primeiro gol</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={betForm.player_points}
            onChange={(event) => setAllocation('player_points', event.target.value)}
          />

          <div className="projection">
            <p>Total alocado: <strong>{fmt(totalAllocated)}</strong> de 10 pts</p>
            <p className="small">Restante para distribuir: {fmt(remaining)} pts</p>
            <p>Possibilidade máxima:</p>
            <strong>{fmt(maxPossible(betForm))} pts</strong>
          </div>

          <button disabled={loading || Boolean(myBet)} onClick={saveBet}>
            {myBet ? 'Aposta já registrada' : 'Confirmar aposta'}
          </button>
        </div>

        <div className="card">
          <h2>📌 Regras Resumidas</h2>
          <div className="rules">
            Cada participante tem <strong>10 pontos</strong> para distribuir.<br /><br />
            Resultado: <strong>peso 1</strong><br />
            Placar exato: <strong>peso 2</strong><br />
            Primeiro gol: <strong>peso 3</strong><br /><br />
            A soma não pode passar de <strong>10 pontos</strong>.<br />
            Os <strong>5 primeiros colocados</strong> compõem o ranking final.
          </div>
        </div>

        <div className="card wide">
          <h2>🏆 Ranking Top 5</h2>
          <Ranking />
        </div>

        <div className="card wide">
          <h2>📜 Minha aposta</h2>

          {myBet ? (
            <div className="row">
              <div>
                <strong>{myBet.result_pick} • Brasil {myBet.brazil_score} x {myBet.japan_score} Japão</strong>
                <br />
                <small>
                  Resultado: {fmt(myBet.result_points)} • Placar: {fmt(myBet.score_points)} • 1º gol: {myBet.first_goal_player} / {fmt(myBet.player_points)}
                </small>
                <br />
                <small>
                  Total {fmt(myBet.total_allocated)}/10 • Possibilidade {fmt(myBet.max_possible)} pts • {calcScore(myBet, official).details}
                </small>
              </div>

              <div className="badge">{fmt(calcScore(myBet, official).score)} pts</div>
            </div>
          ) : (
            <p>Nenhuma aposta ainda.</p>
          )}
        </div>
      </div>
    </main>
  )
}
