import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { removeAuthToken } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const messagesRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const navigate = useNavigate();
  const speech = useSpeechRecognition();
  const [speechLang, setSpeechLang] = useState(() => localStorage.getItem('speech_lang') || 'en-IN');

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    // only auto-scroll if user is near the bottom
    const el = messagesRef.current;
    const threshold = 160;
    const nearBottom = !el || (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold;
    if (nearBottom) {
      // ensure DOM is painted before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [chats]);

  const fetchChatHistory = async () => {
    try {
      setLoadingHistory(true);
      let response;
      try {
        response = await chatAPI.getHistory({ limit: 50 });
      } catch (err) {
        if (err?.response?.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ limit: '50' });
            const res = await fetch(`/api/chat?${params.toString()}`, {
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            });
            if (res.ok) {
              const data = await res.json();
              response = { data };
            } else {
              throw new Error(`Failed to load chat history (${res.status})`);
            }
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Failed to load chat history');
            return;
          }
        } else {
          setError(err.response?.data?.message || 'Failed to load chat history');
          return;
        }
      }

      const sortedChats = response.data.chats.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setChats(sortedChats);
    } catch (err) {
      setError('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // After history finishes loading, jump to bottom once
  useEffect(() => {
    if (!loadingHistory) {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [loadingHistory]);

  // Attach speech result handler to append transcript to question
  useEffect(() => {
    if (!speech.supported) return;
    const detach = speech.attachResultHandler((text) => {
      setQuestion((prev) => (prev ? prev + ' ' + text : text));
    });
    return detach;
  }, [speech.supported]);

  // Apply selected language to speech engine and persist
  useEffect(() => {
    if (speech.setLang) speech.setLang(speechLang);
    localStorage.setItem('speech_lang', speechLang);
  }, [speechLang]);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    const threshold = 120; // px from bottom
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > threshold);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setError('');

    // Add user question to chat immediately
    const userChat = {
      id: Date.now(),
      question: userQuestion,
      answer: '',
      createdAt: new Date().toISOString(),
      isLoading: true,
    };
    setChats((prev) => [...prev, userChat]);

    try {
      setLoading(true);
      try {
        const response = await chatAPI.send(userQuestion);
        // Update chat with AI response
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === userChat.id
              ? {
                  ...response.data.chat,
                  isLoading: false,
                }
              : chat
          )
        );
      } catch (err) {
        if (err?.response?.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ question: userQuestion })
            });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(text || `Failed to get response (${res.status})`);
            }
            const data = await res.json();
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === userChat.id
                  ? {
                      ...data.chat,
                      isLoading: false,
                    }
                  : chat
              )
            );
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Failed to get response. Please try again.');
            // Remove failed chat
            setChats((prev) => prev.filter((chat) => chat.id !== userChat.id));
            return;
          }
        } else {
          setError(err.response?.data?.message || 'Failed to get response. Please try again.');
          // Remove failed chat
          setChats((prev) => prev.filter((chat) => chat.id !== userChat.id));
          return;
        }
      }
    } catch (err) {
      setError('Failed to get response. Please try again.');
      // Remove failed chat
      setChats((prev) => prev.filter((chat) => chat.id !== userChat.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-6 max-w-4xl mb-4">
        <Card className="h-[60vh] md:h-[65vh] lg:h-[70vh] flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>AI Health Chat Assistant</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 relative min-h-0">
            {error && (
              <div className="mx-4 my-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div ref={messagesRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto p-4 overscroll-contain scrollbar-thin">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="md" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg mb-2">👋 Start a conversation</p>
                    <p className="text-sm">Ask me about diabetes management, nutrition, or lifestyle tips.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chats.map((chat) => (
                    <div key={chat.id} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 shadow-sm max-w-[80%]">
                          <p className="text-xs opacity-80 mb-1">You</p>
                          <p className="text-sm whitespace-pre-wrap">{chat.question}</p>
                        </div>
                      </div>

                      {/* AI bubble */}
                      <div className="flex justify-start">
                        <div className="rounded-2xl border px-4 py-2 shadow-sm max-w-[80%]">
                          <p className="text-xs opacity-80 mb-1">AI Assistant</p>
                          {chat.isLoading && !chat.answer ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner size="sm" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{chat.answer}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            {showScrollDown && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 rounded-full bg-primary text-primary-foreground shadow-md px-3 py-2 text-sm"
                aria-label="Scroll to bottom"
              >
                ↓ New messages
              </button>
            )}

            {/* Composer */}
            <form onSubmit={handleSubmit} className="border-t p-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about diabetes management, nutrition, or lifestyle..."
                  disabled={loading}
                  className="flex-1"
                />
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value)}
                  className="h-9 rounded-md border bg-transparent px-2 text-sm"
                  title="Speech language"
                >
                  <option value="en-IN">EN</option>
                  <option value="hi-IN">HI</option>
                  <option value="mr-IN">MR</option>
                </select>
                <Button
                  type="button"
                  variant={speech.listening ? 'destructive' : 'outline'}
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  title={speech.supported ? (speech.listening ? 'Stop voice input' : 'Start voice input') : 'Voice input not supported'}
                  disabled={!speech.supported}
                >
                  {speech.listening ? 'Stop' : '🎤 Mic'}
                </Button>
                <Button type="submit" disabled={loading || !question.trim()}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Send'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 p-3 rounded-lg border text-sm text-muted-foreground">
          <strong>Note:</strong> This AI assistant provides general lifestyle and nutrition guidance only. It is not a substitute for professional medical advice.
        </div>
      </div>
      <Footer />
    </div>
  );
}
;

export default Chat;

