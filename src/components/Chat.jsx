import { useState, useEffect, useRef } from 'react'
import { Send, Image, Smile, X } from 'lucide-react'

const EMOJI_LIST = [
  '😀', '😂', '😍', '🥰', '😎', '🤩', '😤', '😢', '🥺', '😱',
  '💪', '🔥', '⚡', '🏋️', '🤸', '🏃', '🎯', '🏆', '🥇', '💯',
  '👍', '👏', '🙌', '✅', '❤️', '💚', '⭐', '🌟', '💥', '🎉',
  '🍎', '🥗', '🥩', '🥚', '💧', '☕', '🍌', '🥑', '🍗', '🥛',
]

const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3005' : ''

function parseMessage(text) {
  const imageMatch = text.match(/^\[image:(\/uploads\/[^\]]+)\]$/)
  if (imageMatch) {
    return { type: 'image', url: `${SERVER_URL}${imageMatch[1]}` }
  }
  return { type: 'text', content: text }
}

export default function Chat({ messages, onSend, onSendImage, isAdmin = false, pollMessages }) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const fileRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const initialLoadRef = useRef(true)

  // Track scroll position
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  // Scroll to bottom on initial load (instant), then smooth for updates
  useEffect(() => {
    if (messages.length === 0) return
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      isNearBottomRef.current = true
      return
    }
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!pollMessages) return
    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [pollMessages])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    setShowEmoji(false)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file && onSendImage) {
      onSendImage(file)
    }
    e.target.value = ''
  }

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji)
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'Z')
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = isAdmin ? msg.sender === 'admin' : msg.sender === 'user'
          const parsed = parseMessage(msg.text)

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMe
                  ? 'bg-neon text-black rounded-br-md'
                  : 'bg-[#262626] border border-gray-700/40 text-white rounded-bl-md shadow-md'
              }`}>
                {parsed.type === 'image' ? (
                  <img
                    src={parsed.url}
                    alt="Shared"
                    onClick={() => setLightbox(parsed.url)}
                    className="max-w-full max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.content}</p>
                )}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-black/50' : 'text-gray-600'}`}>
                  {isMe ? 'You' : (isAdmin ? 'User' : 'Trainer')} · {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-16 left-4 right-4 bg-dark-card border border-dark-border rounded-xl p-3 shadow-xl z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">Emojis</span>
            <button onClick={() => setShowEmoji(false)} className="text-gray-500 hover:text-white cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-dark-surface rounded-lg cursor-pointer transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-dark-border px-4 py-3 bg-dark-card">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              showEmoji ? 'bg-neon/20 text-neon' : 'text-gray-500 hover:text-neon hover:bg-dark-surface'
            }`}
          >
            <Smile size={18} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-neon hover:bg-dark-surface transition-colors cursor-pointer shrink-0"
          >
            <Image size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => setShowEmoji(false)}
            placeholder="Type a message..."
            className="flex-1 bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neon"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-9 h-9 rounded-lg bg-neon flex items-center justify-center text-black hover:bg-neon-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Lightbox for images */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer z-10">
            <X size={24} />
          </button>
          <img src={lightbox} alt="Full" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
}
