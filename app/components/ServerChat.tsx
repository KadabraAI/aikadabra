import { getMessages, sendMessage, clearMessages } from '../actions';

async function handleSendMessage(formData: FormData) {
  'use server';
  const message = formData.get('message')?.toString() || '';
  if (message.trim()) {
    await sendMessage(message);
  }
}

export default async function ServerChat() {
  const messages = await getMessages();

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light tracking-wider text-center">AIKADABRA</h1>
          <p className="text-sm text-gray-400 mt-2 text-center tracking-widest">
            ANONYMOUS • UNCENSORED • MINIMAL
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="border border-gray-800 p-8 max-w-md mx-auto">
                <h2 className="text-xl mb-4">WELCOME TO AIKADABRA</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Ask anything. No filters. No tracking. Pure anonymous conversation.
                </p>
                <div className="mt-6 border-t border-gray-800 pt-4">
                  <p className="text-xs text-gray-500">Type your message below to begin.</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message: { id: string; sender: string; text: string; timestamp: string }) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  message.sender === 'user' ? 'ml-12' : 'mr-12'
                }`}
              >
                <div
                  className={`border ${
                    message.sender === 'user'
                      ? 'border-white bg-white text-black'
                      : 'border-gray-700 bg-gray-900'
                  } p-4`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          <form action={handleSendMessage} className="flex space-x-3" key="chat-form">
            <textarea
              name="message"
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-black border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none transition-colors"
              rows={2}
              required
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all duration-200 active:scale-95"
            >
              SEND
            </button>
          </form>
          
          {messages.length > 0 && (
            <form action={clearMessages} className="mt-3">
              <button
                type="submit"
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                CLEAR CONVERSATION
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}