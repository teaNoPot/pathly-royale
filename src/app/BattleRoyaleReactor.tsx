'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandThumbUpIcon, MinusCircleIcon, HandThumbDownIcon, TrophyIcon, EyeIcon } from '@heroicons/react/24/solid'

const situations = [
  { text: "You find a wallet on the street with $500 inside.", image: "/placeholder.svg?height=200&width=300" },
  { text: "Your best friend forgets your birthday.", image: "/placeholder.svg?height=200&width=300" },
  { text: "You get a surprise promotion at work.", image: "/placeholder.svg?height=200&width=300" },
  { text: "You accidentally spill coffee on your boss's new shirt.", image: "/placeholder.svg?height=200&width=300" },
  { text: "You win a free trip to your dream destination.", image: "/placeholder.svg?height=200&width=300" }
]

const reactionOptions = [
  { icon: HandThumbUpIcon, text: 'Good', color: 'bg-green-500' },
  { icon: MinusCircleIcon, text: 'Neutral', color: 'bg-yellow-500' },
  { icon: HandThumbDownIcon, text: 'Bad', color: 'bg-red-500' }
]

type Reaction = {
  [key: string]: number
}

type ChatMessage = {
  author: string
  text: string
}

type Player = {
  name: string
  score: number
  eliminated: boolean
}

const simulatedUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve']

export default function BattleRoyaleReactor() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu')
  const [currentSituation, setCurrentSituation] = useState(0)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Reaction>({})
  const [timeLeft, setTimeLeft] = useState(30)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [players, setPlayers] = useState<Player[]>([
    { name: 'You', score: 0, eliminated: false },
    ...simulatedUsers.map(name => ({ name, score: 0, eliminated: false }))
  ])
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameState === 'playing' && timeLeft === 0 && !userReaction) {
      handleAutoVote()
    }
  }, [timeLeft, userReaction, gameState])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    if (gameState === 'playing') {
      simulateOtherUsersVotes()
      setTimeLeft(30)
      setUserReaction(null)
      simulateChatMessages()
    }
  }, [currentSituation, gameState])

  const startGame = () => {
    setGameState('playing')
    setCurrentSituation(0)
    setPlayers(players.map(player => ({ ...player, score: 0, eliminated: false })))
    setChatMessages([])
  }

  const simulateOtherUsersVotes = () => {
    const simulatedReactions: Reaction = {
      'Good': 0,
      'Neutral': 0,
      'Bad': 0
    }
    players.forEach(player => {
      if (player.name !== 'You' && !player.eliminated) {
        const randomReaction = reactionOptions[Math.floor(Math.random() * reactionOptions.length)].text
        simulatedReactions[randomReaction]++
      }
    })
    setReactions(simulatedReactions)
  }

  const simulateChatMessages = () => {
    const newMessages: ChatMessage[] = players
      .filter(player => player.name !== 'You' && !player.eliminated)
      .map(player => ({
        author: player.name,
        text: `I think this situation is ${reactionOptions[Math.floor(Math.random() * reactionOptions.length)].text.toLowerCase()}.`
      }))
    setChatMessages(prev => [...prev, ...newMessages])
  }

  const handleReaction = (reactionText: string) => {
    if (!userReaction && !players[0].eliminated) {
      setUserReaction(reactionText)
      setReactions(prev => ({
        ...prev,
        [reactionText]: (prev[reactionText] || 0) + 1
      }))
      checkMajorityVote(reactionText)
    }
  }

  const handleAutoVote = () => {
    const leastVotedReaction = Object.entries(reactions).reduce((a, b) => a[1] < b[1] ? a : b)[0]
    handleReaction(leastVotedReaction)
  }

  const checkMajorityVote = (userVote: string) => {
    const totalVotes = Object.values(reactions).reduce((a, b) => a + b, 0)
    const majorityVote = Object.entries(reactions).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    setPlayers(prev => prev.map(player => {
      if (player.name === 'You') {
        return { ...player, score: player.score + (userVote === majorityVote ? 1 : 0) }
      }
      const randomVote = Math.random() < 0.6 // 60% chance to vote with majority
      return { ...player, score: player.score + (randomVote ? 1 : 0) }
    }))
  }

  const handleContinue = () => {
    if (currentSituation < situations.length - 1) {
      setCurrentSituation(prev => prev + 1)
      if ((currentSituation + 1) % 2 === 0) {
        eliminatePlayers()
      }
    } else {
      setGameState('ended')
    }
  }

  const eliminatePlayers = () => {
    const maxPossibleScore = currentSituation + 1
    const threshold = maxPossibleScore / 2
    let playersAboveThreshold = players.filter(player => player.score > threshold).length

    setPlayers(prev => prev.map(player => {
      if (player.eliminated) return player
      if (player.score <= threshold && playersAboveThreshold > 1) {
        playersAboveThreshold--
        return { ...player, eliminated: true }
      }
      return player
    }))
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && !players[0].eliminated) {
      setChatMessages(prev => [...prev, { author: 'You', text: newMessage.trim() }])
      setNewMessage('')
    }
  }

  const renderGameContent = () => (
    <div className="flex h-full">
      <div className="w-2/3 p-8 bg-gray-800 text-white rounded-l-xl">
        <motion.div
          key={currentSituation}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-bold mb-4">Situation {currentSituation + 1}</h2>
          <div className="relative overflow-hidden rounded-lg mb-4">
            <img
              src={situations[currentSituation].image}
              alt="Situation illustration"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <p className="text-white text-xl font-semibold text-center p-4">
                {situations[currentSituation].text}
              </p>
            </div>
          </div>
        </motion.div>
        <div className="mb-4 text-xl font-semibold">Time left: {timeLeft}s</div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {reactionOptions.map(({ icon: Icon, text, color }) => (
            <motion.button
              key={text}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReaction(text)}
              className={`flex items-center justify-center space-x-3 py-3 px-4 rounded-full ${color} text-white transition-colors ${
                userReaction === text ? 'ring-4 ring-white' : ''
              }`}
              disabled={!!userReaction || players[0].eliminated}
            >
              <Icon className="w-6 h-6" />
              <span className="text-lg font-medium">{text}</span>
            </motion.button>
          ))}
        </div>
        {userReaction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-xl font-semibold mb-3">Results:</h3>
            <div className="space-y-2">
              {Object.entries(reactions).map(([reaction, count]) => (
                <div key={reaction} className="flex items-center">
                  <span className="w-16 font-medium">{reaction}:</span>
                  <div className="flex-grow bg-gray-700 rounded-full h-4 ml-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / Object.values(reactions).reduce((a, b) => a + b, 0)) * 100}%` }}
                      className={`h-full rounded-full ${
                        reaction === 'Good' ? 'bg-green-500' : reaction === 'Neutral' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="ml-2 text-sm">{count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleContinue}
              className="mt-6 w-full px-6 py-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
            >
              Next Situation
            </button>
          </motion.div>
        )}
        <div className="text-xl font-semibold">Your score: {players[0].score}</div>
        {players[0].eliminated && (
          <div className="mt-4 text-xl font-semibold text-red-500 flex items-center">
            <EyeIcon className="w-6 h-6 mr-2" /> You are eliminated (Spectator mode)
          </div>
        )}
      </div>
      <div className="w-1/3 bg-gray-700 p-6 rounded-r-xl">
        <h3 className="text-2xl font-semibold mb-4 text-white">Chat</h3>
        <div ref={chatRef} className="h-[calc(100vh-16rem)] overflow-y-auto mb-4 bg-gray-800 rounded-lg p-4">
          <AnimatePresence>
            {chatMessages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-2 text-white"
              >
                <span className="font-semibold">{message.author}: </span>
                <span>{message.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow p-2 bg-gray-800 text-white border border-gray-600 rounded-l-md"
            placeholder="Type your message..."
            disabled={players[0].eliminated}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition-colors"
            disabled={players[0].eliminated}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <h1 className="text-5xl font-bold mb-8">Pathly Royale</h1>
      <button
        onClick={startGame}
        className="px-8 py-4 bg-blue-500 text-2xl rounded-full hover:bg-blue-600 transition-colors"
      >
        Start Game
      </button>
    </div>
  )

  const renderLeaderboard = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <h2 className="text-4xl font-bold mb-8">Game Over - Leaderboard</h2>
      <div className="bg-gray-800 p-6 rounded-xl w-96">
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <div key={player.name} className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-4">{index + 1}.</span>
                <span className="text-xl">{player.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xl font-semibold mr-2">{player.score}</span>
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          
          ))}
      </div>
      <button
        onClick={() => setGameState('menu')}
        className="mt-8 px-6 py-3 bg-blue-500 text-xl rounded-full hover:bg-blue-600 transition-colors"
      >
        Back to Menu
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[calc(100vh-2rem)]">
        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderGameContent()}
        {gameState === 'ended' && renderLeaderboard()}
      </div>
    </div>
  )
}