"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import confetti from "canvas-confetti"

type PlayerStatus = "active" | "eliminated" | "safe"
type Phase2Status = "pending" | "opened"

interface Player {
  id: number
  status: PlayerStatus
  phase2Status: Phase2Status
  phase2Result?: "pass" | "fail"
}

type Phase = 1 | 2 | 3

interface MathRule {
  name: string
  description: string
  check: (id: number) => boolean
}

const generateMathRules = (): MathRule[] => {
  const endsWithDigit = Math.floor(Math.random() * 10)
  const sumTarget = Math.floor(Math.random() * 10) + 5 // Random sum from 5-14
  const divisor = [3, 4, 5, 7][Math.floor(Math.random() * 4)]

  return [
    {
      name: "Double Digits",
      description: "ใครที่มีเลขเบิ้ล (11, 22, 33, 44...)",
      check: (id: number) => {
        const str = id.toString()
        return str.length === 2 && str[0] === str[1]
      },
    },
    {
      name: "Ends With",
      description: `หมายเลขที่ลงท้ายด้วย ${endsWithDigit}`,
      check: (id: number) => id % 10 === endsWithDigit,
    },
    {
      name: "Sum Equals",
      description: `ผลรวมตัวเลขเท่ากับ ${sumTarget}`,
      check: (id: number) => {
        const sum = id
          .toString()
          .split("")
          .reduce((acc, digit) => acc + Number.parseInt(digit), 0)
        return sum === sumTarget
      },
    },
    {
      name: "Divisible By",
      description: `หารด้วย ${divisor} ลงตัว`,
      check: (id: number) => id % divisor === 0,
    },
  ]
}

const challenges = [
  "ถ้า ใส่แว่นตา... ตกรอบ!",
  "ถ้า ใส่รองเท้าสีขาว... ตกรอบ!",
  "ถ้า แบตมือถือเหลือน้อยกว่า 50%... ตกรอบ!",
  "คนเปิดกล่อง... ตกรอบ!",
  "ถ้า ใส่นาฬิกา... ตกรอบ!",
  "ดวงดี! รอดตัวไป (Safe)",
  "ถ้า ใส่เครื่องประดับสีทอง... ตกรอบ!",
  "ถ้า มีสีแดงบนตัว... ตกรอบ!",
]

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default function ChristmasPartyGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [totalPlayers, setTotalPlayers] = useState(20)
  const [players, setPlayers] = useState<Player[]>([])
  const [phase, setPhase] = useState<Phase>(1)

  const [currentMathRule, setCurrentMathRule] = useState<MathRule | null>(null)
  const [questionModalOpen, setQuestionModalOpen] = useState(false)

  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [eliminatedPlayers, setEliminatedPlayers] = useState<number[]>([])

  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [currentChallenge, setCurrentChallenge] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [flippingCard, setFlippingCard] = useState<number | null>(null)

  const [phase3Cards, setPhase3Cards] = useState<Array<{ id: number; isWinner: boolean; revealed: boolean }>>([])
  const [winner, setWinner] = useState<number | null>(null)

  // Falling snow effect
  useEffect(() => {
    const snowflakes: HTMLDivElement[] = []
    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement("div")
      snowflake.className = "snowflake"
      snowflake.textContent = "❄"
      snowflake.style.left = `${Math.random() * 100}vw`
      snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`
      snowflake.style.animationDelay = `${Math.random() * 2}s`
      snowflake.style.fontSize = `${Math.random() * 10 + 10}px`
      document.body.appendChild(snowflake)
      snowflakes.push(snowflake)
    }

    return () => {
      snowflakes.forEach((snowflake) => snowflake.remove())
    }
  }, [])

  const startGame = () => {
    const initialPlayers: Player[] = Array.from({ length: totalPlayers }, (_, i) => ({
      id: i + 1,
      status: "active",
      phase2Status: "pending",
    }))
    setPlayers(initialPlayers)
    setGameStarted(true)
    setPhase(1)
  }

  const activePlayers = players.filter((p) => p.status === "active")
  const activePlayerCount = activePlayers.length

  useEffect(() => {
    if (phase === 3) return

    if (activePlayerCount > 8) {
      setPhase(1)
      setQuestionModalOpen(false)
      setCurrentMathRule(null)
    } else if (activePlayerCount >= 4 && activePlayerCount <= 8) {
      setPhase(2)
    }
    // Removed automatic Phase 3 transition
  }, [activePlayerCount, phase])

  const showMathQuestion = () => {
    const rules = generateMathRules()
    const randomRule = rules[Math.floor(Math.random() * rules.length)]
    setCurrentMathRule(randomRule)
    setQuestionModalOpen(true)
  }

  const revealVictims = () => {
    if (!currentMathRule) return

    const matchingPlayers = activePlayers.filter((p) => currentMathRule.check(p.id))

    let victimsToEliminate = matchingPlayers
    if (matchingPlayers.length > 3) {
      victimsToEliminate = shuffleArray(matchingPlayers).slice(0, 3)
    }

    // Close question modal
    setQuestionModalOpen(false)

    if (victimsToEliminate.length === 0) {
      setModalMessage(`ไม่มีใครตรงกับโจทย์!\n\nไม่มีใครตกรอบในรอบนี้!`)
      setResultModalOpen(true)
      setCurrentMathRule(null)
      return
    }

    const victimIds = victimsToEliminate.map((p) => p.id)
    setEliminatedPlayers(victimIds)
    setModalMessage(`ผู้โชคร้าย:\n\nหมายเลข ${victimIds.join(", ")} ตกรอบ!`)
    setResultModalOpen(true)

    setTimeout(() => {
      setPlayers((prev) => prev.map((p) => (victimIds.includes(p.id) ? { ...p, status: "eliminated" } : p)))
      setEliminatedPlayers([])
      setCurrentMathRule(null)
    }, 2000)
  }

  const openGiftBox = (playerId: number) => {
    setFlippingCard(playerId)

    setTimeout(() => {
      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
      setCurrentChallenge(randomChallenge)
      setSelectedPlayer(playerId)
      setChallengeModalOpen(true)
      setFlippingCard(null)
    }, 600)
  }

  const handleChallengeResult = (passed: boolean) => {
    if (selectedPlayer === null) return

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === selectedPlayer
          ? {
              ...p,
              status: passed ? "safe" : "eliminated",
              phase2Status: "opened",
              phase2Result: passed ? "pass" : "fail",
            }
          : p,
      ),
    )

    setChallengeModalOpen(false)
    setSelectedPlayer(null)
    setCurrentChallenge("")
  }

  const resetPhase2Boxes = () => {
    setPlayers((prev) =>
      prev.map((p) => (p.status === "safe" ? { ...p, status: "active", phase2Status: "pending" } : p)),
    )
  }

  const goToFinalPhase = () => {
    const survivors = players.filter((p) => p.status === "safe")
    const survivorCount = survivors.length

    // Move safe players to active
    setPlayers((prev) => prev.map((p) => (p.status === "safe" ? { ...p, status: "active" } : p)))

    // Initialize mystery cards based on number of survivors
    const cardArray = Array.from({ length: survivorCount }, (_, i) => i)
    const shuffled = shuffleArray(cardArray)
    const winnerPosition = shuffled[0]

    setPhase3Cards(
      Array.from({ length: survivorCount }, (_, i) => ({
        id: i + 1,
        isWinner: i === winnerPosition,
        revealed: false,
      })),
    )

    setPhase(3)
  }

  const allActiveOpenedBoxes = activePlayers.every((p) => p.phase2Status === "opened")
  const allGoldBoxesOpened = phase === 2 && allActiveOpenedBoxes

  const pickFinalCard = (cardId: number) => {
    const card = phase3Cards.find((c) => c.id === cardId)
    if (card) {
      setPhase3Cards((prev) => prev.map((c) => (c.id === cardId ? { ...c, revealed: true } : c)))
      if (card.isWinner) {
        setWinner(card.id)
        confetti()
      }
    }
  }

  if (!gameStarted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #0F1729 0%, #1a2332 100%)" }}
      >
        <Card className="p-12 max-w-2xl w-full bg-[#8B0000] border-4 border-[#FFD700]">
          <h1 className="text-5xl font-bold text-center mb-6 text-[#FFD700]">THE CHOSEN ONE</h1>
          <h2 className="text-3xl font-semibold text-center mb-12 text-white">ศึกชิงรางวัลซานต้า</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-4 font-medium text-2xl text-center">จำนวนผู้เล่น:</label>
              <Input
                type="number"
                value={totalPlayers}
                onChange={(e) => setTotalPlayers(Number.parseInt(e.target.value) || 1)}
                min="3"
                className="bg-white text-black border-4 border-[#FFD700] text-5xl p-8 text-center font-bold"
              />
            </div>
            <Button
              onClick={startGame}
              className="w-full h-20 bg-[#0B4619] hover:bg-[#0d5a20] text-[#FFD700] font-bold text-3xl border-4 border-[#FFD700]"
            >
              เริ่มเกม
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (winner !== null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #0F1729 0%, #1a2332 100%)" }}
      >
        <div className="text-center">
          <div className="text-8xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-6xl font-bold text-[#FFD700] mb-4">ผู้ชนะคือ</h1>
          <div className="text-9xl font-bold text-white mb-8">#{winner}</div>
          <div className="text-4xl text-[#FFD700]">🎄 ยินดีด้วย! 🎄</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "linear-gradient(135deg, #0F1729 0%, #1a2332 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 text-[#FFD700]">THE CHOSEN ONE: ศึกชิงรางวัลซานต้า</h1>
        <div className="text-center mb-8 text-2xl text-white">
          <span className="bg-[#8B0000] px-6 py-2 rounded-full border-2 border-[#FFD700]">
            ผู้เล่นที่เหลือ: {activePlayerCount}
          </span>
        </div>

        {phase === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#FFD700] mb-2">PHASE 1: The Math Suspense</h2>
              <p className="text-white text-xl">โจทย์อาถรรพ์คัดผู้โชคร้าย</p>
            </div>

            <div className="flex justify-center mb-8">
              <Button
                onClick={showMathQuestion}
                className="h-20 bg-[#8B0000] hover:bg-[#a80000] text-white font-bold text-3xl px-16 border-4 border-[#FFD700] shadow-2xl"
              >
                สุ่มโจทย์อาถรรพ์
              </Button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`aspect-square flex items-center justify-center text-2xl font-bold rounded-lg border-4 transition-all ${
                    player.status === "eliminated"
                      ? "bg-red-600 text-white border-red-900"
                      : eliminatedPlayers.includes(player.id)
                        ? "bg-red-500 text-white border-red-700 animate-pulse"
                        : "bg-white text-[#0B4619] border-[#FFD700] hover:scale-110"
                  }`}
                >
                  {player.id}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#FFD700] mb-2">PHASE 2: Survivor's Destiny</h2>
              <p className="text-white text-xl">คลิกเลขเพื่อเปิดกล่องของขวัญ</p>
            </div>

            {allGoldBoxesOpened && (
              <div className="flex justify-center">
                <Button
                  onClick={goToFinalPhase}
                  className="h-20 bg-[#0B4619] hover:bg-[#0d5a20] text-[#FFD700] font-bold text-3xl px-16 border-4 border-[#FFD700] shadow-2xl animate-pulse"
                >
                  ไปสู่รอบตัดสิน (Go to Final Phase)
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {activePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => player.phase2Status === "pending" && openGiftBox(player.id)}
                  disabled={player.phase2Status === "opened"}
                  className={`aspect-square flex flex-col items-center justify-center text-3xl font-bold rounded-lg border-4 transition-all relative ${
                    player.phase2Status === "opened" && player.phase2Result === "fail"
                      ? "bg-red-600 text-white border-red-900 cursor-not-allowed"
                      : player.phase2Status === "opened" && player.phase2Result === "pass"
                        ? "bg-green-600 text-white border-green-900 cursor-not-allowed"
                        : flippingCard === player.id
                          ? "bg-[#FFD700] text-[#8B0000] border-[#0B4619] animate-pulse"
                          : "bg-[#FFD700] text-[#8B0000] border-[#0B4619] hover:scale-105 cursor-pointer"
                  }`}
                  style={{
                    transform: flippingCard === player.id ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.6s",
                  }}
                >
                  <div className="text-4xl mb-2">🎁</div>
                  <div className="text-2xl font-bold">{player.id}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#FFD700] mb-2">PHASE 3: The Final Draw</h2>
              <p className="text-white text-xl">เลือกการ์ดลึกลับ - มีเพียง 1 ใบที่เป็นผู้ชนะ</p>
              <p className="text-white text-lg mt-2">ผู้เล่น: {activePlayers.map((p) => `#${p.id}`).join(", ")}</p>
            </div>

            <div
              className={`grid gap-6 max-w-6xl mx-auto ${
                phase3Cards.length <= 3
                  ? "grid-cols-3"
                  : phase3Cards.length === 4
                    ? "grid-cols-4"
                    : phase3Cards.length === 5
                      ? "grid-cols-5"
                      : "grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
              }`}
            >
              {phase3Cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => !card.revealed && pickFinalCard(card.id)}
                  disabled={card.revealed}
                  className={`aspect-[3/4] flex flex-col items-center justify-center text-5xl font-bold rounded-xl border-8 transition-all shadow-2xl ${
                    card.revealed
                      ? card.isWinner
                        ? "bg-gradient-to-br from-green-500 to-green-700 border-[#FFD700]"
                        : "bg-gradient-to-br from-red-600 to-red-800 border-red-900"
                      : "bg-gradient-to-br from-[#FFD700] to-[#FFA500] border-white hover:scale-105 cursor-pointer"
                  }`}
                >
                  {card.revealed ? (
                    <>
                      <div className="text-8xl mb-4">{card.isWinner ? "👑" : "💀"}</div>
                      <div className="text-2xl text-white">{card.isWinner ? "WINNER" : "ELIMINATED"}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl mb-4">🎴</div>
                      <div className="text-xl text-[#8B0000]">?</div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {questionModalOpen && currentMathRule && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <Card className="bg-[#8B0000] border-4 border-[#FFD700] p-12 max-w-2xl w-full">
              <h3 className="text-3xl font-bold text-[#FFD700] mb-6 text-center">โจทย์อาถรรพ์</h3>
              <div className="text-white text-3xl mb-8 text-center font-bold">{currentMathRule.description}</div>
              <Button
                onClick={revealVictims}
                className="w-full h-20 bg-[#0B4619] hover:bg-[#0d5a20] text-[#FFD700] font-bold text-3xl border-4 border-[#FFD700]"
              >
                เฉลยผู้โชคร้าย
              </Button>
            </Card>
          </div>
        )}

        {resultModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <Card className="bg-[#8B0000] border-4 border-[#FFD700] p-12 max-w-2xl w-full">
              <div className="text-white text-3xl whitespace-pre-line mb-8 text-center font-bold">{modalMessage}</div>
              <Button
                onClick={() => setResultModalOpen(false)}
                className="w-full h-20 bg-[#0B4619] hover:bg-[#0d5a20] text-[#FFD700] font-bold text-3xl border-4 border-[#FFD700]"
              >
                ตกลง (OK)
              </Button>
            </Card>
          </div>
        )}

        {challengeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <Card className="bg-[#0B4619] border-4 border-[#FFD700] p-12 max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎁</div>
                <div className="text-[#FFD700] text-4xl font-bold mb-4">หมายเลข {selectedPlayer}</div>
                <div className="text-white text-3xl font-bold mb-8">{currentChallenge}</div>
              </div>
              <div className="flex gap-6">
                <Button
                  onClick={() => handleChallengeResult(true)}
                  className="flex-1 h-20 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl border-4 border-white"
                >
                  รอด (PASS)
                </Button>
                <Button
                  onClick={() => handleChallengeResult(false)}
                  className="flex-1 h-20 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl border-4 border-white"
                >
                  ไม่รอด (FAIL)
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
