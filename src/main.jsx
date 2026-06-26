
import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

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
  'Operacional',
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
  'Japão - Shuto Machino',
]

function cleanCpf(value) {
  return String(value || '').replace(/\D/g, '')
}

function fmt(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function placeholder(name) {
  const initial = (name || '?').trim().charAt(0) || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="#10233d"/><text x="50" y="60" font-size="36" text-anchor="middle" fill="#f5c542">${initial}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

function multiplier(type, value) {
  if (type === 'result') {
    if (value === 'Brasil') return 1.25
    if (value === 'Empate') return 2.5
    if (value === 'Japão') return 3.2
  }
  if (type === 'score') return 5
  if (type === 'goal') return value === 'Nenhum' ? 4 : 3
  return 1
}

function calcMaxPossible(bet) {
  return (
    Number(bet.result_points || 0) * 1 * multiplier('result', bet.result_pick) +
    Number(bet.score_points || 0) * 2 * multiplier('score') +
    Number(bet.player_points || 0) * 3 * multiplier('goal', bet.first_goal_player)
  )
}

function calcScore(bet, official) {
  let score = 0
  const details = []

  if (bet.result_pick === official.result) {
    const pts = Number(bet.result_points || 0) * 1 * multiplier('result', bet.result_pick)
    score += pts
    details.push('resultado +' + fmt(pts))
  }

  if (
    Number(bet.brazil_score) === Number(official.brazil_score) &&
    Number(bet.japan_score) === Number(official.japan_score)
  ) {
    const pts = Number(bet.score_points || 0) * 2 * multiplier('score')
    score += pts
    details.push('placar +' + fmt(pts))
  }

  if (normalizeText(bet.first_goal_player) === normalizeText(official.first_goal_player)) {
    const pts = Number(bet.player_points || 0) * 3 * multiplier('goal', bet.first_goal_player)
    score += pts
    details.push('1º gol +' + fmt(pts))
  }

  return { score, details: details.join(', ') || 'sem acerto' }
}

function App() {
  const [role, setRole] = useState(localStorage.getItem('bcc_role') || '')
  const [currentCpf, setCurrentCpf] = useState(localStorage.getItem('bcc_cpf') || '')
  const [participants, setParticipants] = useState([])
  const [bets, setBets] = useState([])
  const [gameResult, setGameResult] = useState({
    result: 'Empate',
    brazil_score: 0,
    japan_score: 0,
    first_goal_player: 'Nenhum',
  })
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [playerForm, setPlayerForm] = useState({
    cpf: '',
    full_name: '',
    team_name: TEAMS[0],
    photo: null,
  })

  const [betForm, setBetForm] = useState({
    result_pick: 'Brasil',
    brazil_score: 2,
    japan_score: 0,
    first_goal_player: 'Brasil - Vinícius Júnior',
    result_points: 4,
    score_points: 3,
    player_points: 3,
  })

  const envMissing = !supabase

  async function loadData() {
    if (!supabase) return

    const p = await supabase.from('participants').select('*').order('created_at', { ascending: false })
    const b = await supabase.from('bets').select('*').order('created_at', { ascending: false })
    const r = await supabase.from('game_result').select('*').eq('id', 1).single()

    if (p.data) setParticipants(p.data)
    if (b.data) setBets(b.data)
    if (r.data) setGameResult(r.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    const channel = supabase
      .channel('bolao-copa-credit')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_result' }, loadData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const currentPlayer = participants.find((p) => p.cpf === currentCpf)
  const currentBet = bets.find((b) => b.cpf === currentCpf)

  function pointsFor(participant) {
    const bet = bets.find((item) => item.cpf === participant.cpf)
    if (!bet) return INITIAL_POINTS
    const result = calcScore(bet, gameResult)
    return INITIAL_POINTS - Number(bet.total_allocated || 0) + result.score
  }

  const ranking = useMemo(() => {
    return participants
      .map((p) => ({ ...p, points: pointsFor(p) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
  }, [participants, bets, gameResult])

  function updateAllocation(field, value) {
    const next = { ...betForm, [field]: Math.max(0, Number(value) || 0) }

    let r = Number(next.result_points || 0)
    let s = Number(next.score_points || 0)
    let g = Number(next.player_points || 0)

    if (field === 'result_points') {
      if (r > INITIAL_POINTS) r = INITIAL_POINTS
      if (s > INITIAL_POINTS - r) s = INITIAL_POINTS - r
      if (g > INITIAL_POINTS - r - s) g = INITIAL_POINTS - r - s
    }

    if (field === 'score_points') {
      if (s > INITIAL_POINTS - r) s = INITIAL_POINTS - r
      if (g > INITIAL_POINTS - r - s) g = INITIAL_POINTS - r - s
    }

    if (field === 'player_points') {
      if (g > INITIAL_POINTS - r - s) g = INITIAL_POINTS - r - s
    }

    setBetForm({ ...next, result_points: r, score_points: s, player_points: g })
  }

  async function uploadPhoto(cpf, file) {
    if (!file || !supabase) return null
    const extension = file.name.split('.').pop() || 'jpg'
    const path = `${cpf}-${Date.now()}.${extension}`
    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upload.error) return null
    const url = supabase.storage.from('avatars').getPublicUrl(path)
    return url.data.publicUrl
  }

  async function enterPlayer() {
    try {
      setLoading(true)
      const cpf = cleanCpf(playerForm.cpf)
      if (cpf.length !== 11) throw new Error('CPF precisa ter 11 números.')
      if (playerForm.full_name.trim().length < 3) throw new Error('Informe o nome completo.')

      const photoUrl = await uploadPhoto(cpf, playerForm.photo)
      const exists = participants.find((p) => p.cpf === cpf)

      if (exists) {
        const updatePayload = {
          full_name: playerForm.full_name.trim(),
          team_name: playerForm.team_name,
        }
        if (photoUrl) updatePayload.photo_url = photoUrl
        const response = await supabase.from('participants').update(updatePayload).eq('cpf', cpf)
        if (response.error) throw response.error
      } else {
        const response = await supabase.from('participants').insert({
          cpf,
          full_name: playerForm.full_name.trim(),
          team_name: playerForm.team_name,
          photo_url: photoUrl,
        })
        if (response.error) throw response.error
      }

      localStorage.setItem('bcc_role', 'player')
      localStorage.setItem('bcc_cpf', cpf)
      setRole('player')
      setCurrentCpf(cpf)
      await loadData()
    } catch (error) {
      alert(error.message || 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  function enterAdmin() {
    if (adminPassword !== ADMIN_PASSWORD) {
      alert('Senha inválida.')
      return
    }
    localStorage.setItem('bcc_role', 'admin')
    localStorage.removeItem('bcc_cpf')
    setRole('admin')
    setCurrentCpf('')
  }

  function logout() {
    localStorage.removeItem('bcc_role')
    localStorage.removeItem('bcc_cpf')
    setRole('')
    setCurrentCpf('')
  }

  async function saveBet() {
    try {
      setLoading(true)
      if (!currentPlayer) throw new Error('Faça o cadastro antes de apostar.')
      if (currentBet) throw new Error('Este CPF já possui uma aposta.')

      const total =
        Number(betForm.result_points || 0) +
        Number(betForm.score_points || 0) +
        Number(betForm.player_points || 0)

      if (total <= 0) throw new Error('Distribua os pontos.')
      if (total > INITIAL_POINTS) throw new Error('A soma não pode passar de 10 pontos.')

      const payload = {
        cpf: currentPlayer.cpf,
        result_pick: betForm.result_pick,
        brazil_score: Number(betForm.brazil_score || 0),
        japan_score: Number(betForm.japan_score || 0),
        first_goal_player: betForm.first_goal_player,
        result_points: Number(betForm.result_points || 0),
        score_points: Number(betForm.score_points || 0),
        player_points: Number(betForm.player_points || 0),
        total_allocated: total,
        max_possible: calcMaxPossible(betForm),
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

  async function updateOfficialResult() {
    try {
      setLoading(true)
      const response = await supabase
        .from('game_result')
        .update({
          result: gameResult.result,
          brazil_score: Number(gameResult.brazil_score || 0),
          japan_score: Number(gameResult.japan_score || 0),
          first_goal_player: gameResult.first_goal_player,
          updated_at: new Date().toISOString(),
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
    if (!confirm('Excluir participante e aposta?')) return
    const response = await supabase.from('participants').delete().eq('cpf', cpf)
    if (response.error) alert(response.error.message)
    await loadData()
  }

  async function deleteBet(cpf) {
    if (!confirm('Excluir aposta e liberar nova aposta?')) return
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
            <div className="rankUser">
              <span className="medal">{medals[index]}</span>
              <img className="avatarSmall" src={p.photo_url || placeholder(p.full_name)} />
              <div>
                <b>{index + 1}. {p.full_name}</b>
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
        <div className="top">
          <div>
            <h1>🏆 Bolão da Copa Credit</h1>
            <p>10 pontos por CPF • 1 aposta por CPF • Ranking Top 5</p>
          </div>
        </div>

        {envMissing && (
          <div className="warning">
            Configure as variáveis da Vercel: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </div>
        )}

        <section className="card loginCard">
          <h2>Entrar como apostador</h2>
          <label>CPF</label>
          <input
            value={playerForm.cpf}
            onChange={(e) => setPlayerForm({ ...playerForm, cpf: e.target.value })}
            placeholder="Somente números"
            inputMode="numeric"
          />

          <label>Nome completo</label>
          <input
            value={playerForm.full_name}
            onChange={(e) => setPlayerForm({ ...playerForm, full_name: e.target.value })}
            placeholder="Nome do participante"
          />

          <label>Equipe</label>
          <select
            value={playerForm.team_name}
            onChange={(e) => setPlayerForm({ ...playerForm, team_name: e.target.value })}
          >
            {TEAMS.map((team) => <option key={team}>{team}</option>)}
          </select>

          <label>Foto do apostador</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPlayerForm({ ...playerForm, photo: e.target.files?.[0] || null })}
          />

          <button disabled={loading || envMissing} onClick={enterPlayer}>Entrar no Bolão</button>

          <hr />

          <h2>Entrar como Administrador</h2>
          <label>Senha Admin</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Senha"
          />
          <button className="dark" onClick={enterAdmin}>Acessar Painel Admin</button>
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
          <button className="ghost" onClick={logout}>Sair</button>
        </div>

        <div className="kpi">
          <div className="card"><p>Participantes</p><strong>{participants.length}</strong></div>
          <div className="card"><p>Apostas</p><strong>{bets.length}</strong></div>
          <div className="card"><p>Sem aposta</p><strong>{participants.length - bets.length}</strong></div>
          <div className="card"><p>Regra</p><strong>10 pts</strong></div>
        </div>

        <div className="grid">
          <div className="card">
            <h2>⚙️ Resultado / Controle</h2>
            <label>Resultado</label>
            <select value={gameResult.result} onChange={(e) => setGameResult({ ...gameResult, result: e.target.value })}>
              <option>Brasil</option>
              <option>Empate</option>
              <option>Japão</option>
            </select>

            <label>Placar</label>
            <div className="score">
              <input type="number" value={gameResult.brazil_score} onChange={(e) => setGameResult({ ...gameResult, brazil_score: e.target.value })} />
              <span>x</span>
              <input type="number" value={gameResult.japan_score} onChange={(e) => setGameResult({ ...gameResult, japan_score: e.target.value })} />
            </div>

            <label>Jogador do primeiro gol</label>
            <select value={gameResult.first_goal_player} onChange={(e) => setGameResult({ ...gameResult, first_goal_player: e.target.value })}>
              {PLAYERS.map((player) => <option key={player}>{player}</option>)}
            </select>

            <button disabled={loading} onClick={updateOfficialResult}>Atualizar ranking</button>
          </div>

          <div className="card">
            <h2>📌 Regras Resumidas</h2>
            <div className="rules">
              Cada cadastro recebe <b>10 pontos</b>.<br />
              Aposta única por <b>CPF</b>.<br /><br />
              Resultado: <b>peso 1</b><br />
              Placar exato: <b>peso 2</b><br />
              Primeiro gol: <b>peso 3</b><br /><br />
              Os <b>5 primeiros colocados</b> compõem o ranking final.
            </div>
          </div>

          <div className="card">
            <h2>📲 QR Code</h2>
            <p className="small">Use este QR Code para divulgar o link do app.</p>
            <img
              className="qr"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(window.location.href)}`}
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
                  <div className="rankUser">
                    <img className="avatarSmall" src={p.photo_url || placeholder(p.full_name)} />
                    <div>
                      <b>{p.full_name}</b>
                      <br />
                      <small>{p.team_name} • CPF {p.cpf} • {hasBet ? '✅ apostou' : '❌ sem aposta'}</small>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="danger" onClick={() => deleteParticipant(p.cpf)}>Excluir</button>
                    {hasBet && <button className="green" onClick={() => deleteBet(p.cpf)}>Liberar nova aposta</button>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card wide">
            <h2>🧾 Controle das apostas</h2>
            {bets.length === 0 && <p>Nenhuma aposta.</p>}
            {bets.map((b) => {
              const player = participants.find((p) => p.cpf === b.cpf)
              const calculated = calcScore(b, gameResult)
              return (
                <div className="row" key={b.cpf}>
                  <div>
                    <b>{player?.full_name || b.cpf}</b>
                    <br />
                    <small>{b.result_pick}: {fmt(b.result_points)} • Placar {b.brazil_score}x{b.japan_score}: {fmt(b.score_points)} • 1º gol {b.first_goal_player}: {fmt(b.player_points)}</small>
                    <br />
                    <small>Total: {fmt(b.total_allocated)}/10 • Possibilidade: {fmt(b.max_possible)} pts • {calculated.details}</small>
                  </div>
                  <div className="badge">{fmt(calculated.score)} pts</div>
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
        <button className="ghost" onClick={logout}>Sair</button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Olá, {currentPlayer?.full_name?.split(' ')[0] || 'participante'}</h2>
          <div className="profileRow">
            <img className="avatar" src={currentPlayer?.photo_url || placeholder(currentPlayer?.full_name)} />
            <div>
              <p>{currentPlayer?.team_name}</p>
              <div className="badge">{fmt(currentPlayer ? pointsFor(currentPlayer) : INITIAL_POINTS)} pts</div>
            </div>
          </div>
          <div className="notice small">
            Só é válida <b>1 aposta por CPF</b>. Após confirmar, apenas o Admin pode liberar alteração.
          </div>
        </div>

        <div className="card">
          <h2>⚽ Palpite Brasil x Japão</h2>

          <label>Resultado</label>
          <select value={betForm.result_pick} onChange={(e) => setBetForm({ ...betForm, result_pick: e.target.value })}>
            <option>Brasil</option>
            <option>Empate</option>
            <option>Japão</option>
          </select>

          <label>Pontos no resultado</label>
          <input type="number" min="0" max="10" step="0.5" value={betForm.result_points} onChange={(e) => updateAllocation('result_points', e.target.value)} />

          <label>Placar exato</label>
          <div className="score">
            <input type="number" min="0" value={betForm.brazil_score} onChange={(e) => setBetForm({ ...betForm, brazil_score: e.target.value })} />
            <span>x</span>
            <input type="number" min="0" value={betForm.japan_score} onChange={(e) => setBetForm({ ...betForm, japan_score: e.target.value })} />
          </div>

          <label>Pontos no placar</label>
          <input type="number" min="0" max="10" step="0.5" value={betForm.score_points} onChange={(e) => updateAllocation('score_points', e.target.value)} />

          <label>Jogador do primeiro gol</label>
          <select value={betForm.first_goal_player} onChange={(e) => setBetForm({ ...betForm, first_goal_player: e.target.value })}>
            {PLAYERS.map((player) => <option key={player}>{player}</option>)}
          </select>

          <label>Pontos no primeiro gol</label>
          <input type="number" min="0" max="10" step="0.5" value={betForm.player_points} onChange={(e) => updateAllocation('player_points', e.target.value)} />

          <div className="projection">
            <p>Total alocado: <b>{fmt(totalAllocated)}</b> de 10 pts</p>
            <p className="small">Restante para distribuir: {fmt(remaining)} pts</p>
            <p>Possibilidade máxima:</p>
            <strong>{fmt(calcMaxPossible(betForm))} pts</strong>
          </div>

          <button disabled={loading || !!currentBet} onClick={saveBet}>
            {currentBet ? 'Aposta já registrada' : 'Confirmar aposta'}
          </button>
        </div>

        <div className="card">
          <h2>📌 Regras Resumidas</h2>
          <div className="rules">
            Cada participante tem <b>10 pontos</b> para distribuir.<br /><br />
            Resultado: <b>peso 1</b><br />
            Placar exato: <b>peso 2</b><br />
            Primeiro gol: <b>peso 3</b><br /><br />
            A soma não pode passar de <b>10 pontos</b>.<br />
            Os <b>5 primeiros colocados</b> compõem o ranking final.
          </div>
        </div>

        <div className="card wide">
          <h2>🏆 Ranking Top 5</h2>
          <Ranking />
        </div>

        <div className="card wide">
          <h2>📜 Minha aposta</h2>
          {currentBet ? (
            <div className="row">
              <div>
                <b>{currentBet.result_pick} • Brasil {currentBet.brazil_score} x {currentBet.japan_score} Japão</b>
                <br />
                <small>Resultado: {fmt(currentBet.result_points)} • Placar: {fmt(currentBet.score_points)} • 1º gol: {currentBet.first_goal_player} / {fmt(currentBet.player_points)}</small>
                <br />
                <small>Total: {fmt(currentBet.total_allocated)}/10 • Possibilidade: {fmt(currentBet.max_possible)} pts • {calcScore(currentBet, gameResult).details}</small>
              </div>
              <div className="badge">{fmt(calcScore(currentBet, gameResult).score)} pts</div>
            </div>
          ) : <p>Nenhuma aposta ainda.</p>}
        </div>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
