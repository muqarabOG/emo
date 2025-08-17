import { useEffect, useState, useRef } from "react";
import { auth, provider, appleProvider } from "./firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import 'jspdf-autotable';

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const options = { month: "short", day: "numeric", hour: "numeric", minute: "numeric" };
  return new Date(dateStr).toLocaleString("en-US", options);
};

// 🔹 Add your Replit backend URL here
const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState(true);
  const [sessionWidth, setSessionWidth] = useState(220);

  const isResizingSession = useRef(false);
  const chatRef = useRef(null);

  // Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const notifyError = (msg) => toast.error(msg, { position: "top-right", autoClose: 4000 });
  const notifySuccess = (msg) => toast.success(msg, { position: "top-right", autoClose: 3000 });

  const handleGoogleSignIn = async () => { try { await signInWithPopup(auth, provider); } catch (err) { notifyError(err.message); } };
  const handleAppleSignIn = async () => { try { await signInWithPopup(auth, appleProvider); } catch (err) { notifyError(err.message); } };
  const handleEmailAuth = async () => {
    if (!email || !password) { notifyError("Email and password required."); return; }
    try {
      if (loginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { notifyError(err.message); }
  };
  const handleLogout = async () => { try { await signOut(auth); notifySuccess("Logged out successfully"); } catch {} };

  // Fetch sessions
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/sessions/${user.uid}`)
      .then(res => res.json())
      .then((fetchedSessions) => {
        const formatted = fetchedSessions.map((s, idx) => ({
          id: s,
          name: s.startsWith("Chat") ? s : `Chat ${idx + 1}`,
          createdAt: new Date(Number(s)) || new Date(),
          messageCount: 0
        }));
        setSessions(formatted);
        if (formatted.length > 0) setCurrentSession(formatted[formatted.length - 1].id);
      })
      .catch(() => notifyError("Failed to load sessions."));
  }, [user]);

  // Fetch chat messages
  useEffect(() => {
    if (!user || !currentSession) return;
    fetch(`${API_URL}/api/chats/${user.uid}/${currentSession}`)
      .then(res => res.json())
      .then((data) => {
        setChatMessages(data);
        setSessions(prev => prev.map(s => s.id === currentSession ? { ...s, messageCount: data.length } : s));
      })
      .catch(() => notifyError("Failed to load chat."));
  }, [user, currentSession]);

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  // Resize sidebar
  useEffect(() => {
    const handleMouseMove = (e) => { if (isResizingSession.current) setSessionWidth(Math.max(180, e.clientX - 20)); };
    const handleMouseUp = () => { isResizingSession.current = false; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, []);

  const createNewSession = () => {
    const id = Date.now().toString();
    setCurrentSession(id);
    setChatMessages([]);
    setSessions(prev => [...prev, { id, name: `Chat ${prev.length + 1}`, createdAt: new Date(), messageCount: 0 }]);
  };

  const exportChatPDF = () => {
    if (!chatMessages.length) { notifyError("No messages to export."); return; }
    const doc = new jsPDF();
    doc.setFontSize(12);
    const rows = chatMessages.map(m => [formatDate(m.date), "You: " + m.message, "AI: " + m.aiResponse]);
    doc.autoTable({ head: [["Time", "User", "AI"]], body: rows });
    doc.save(`EchoMeChat_${currentSession}.pdf`);
    notifySuccess("Chat exported as PDF");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    let sessionId = currentSession || Date.now().toString();
    if (!currentSession) createNewSession();

    setLoading(true);
    try {
      // Fake typing animation
      setChatMessages(prev => [...prev, { message: "", aiResponse: "typing...", date: new Date() }]);
      const res = await fetch(`${API_URL}/api/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, message: input, type: "chat", sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setChatMessages(prev => {
        const newMessages = prev.slice(0, -1); // remove typing animation
        return [...newMessages, { message: input, aiResponse: data.reply, summary: data.entry?.summary, emotions: data.entry?.emotions, date: new Date() }];
      });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messageCount: s.messageCount + 1 } : s));
      setInput("");
    } catch (err) { notifyError("Failed to get reply. Try again."); }
    finally { setLoading(false); }
  };

  // ===== Login Page =====
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <ToastContainer />
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-extrabold text-black mb-6">Welcome to EchoMe</h1>

          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300"/>

          <button onClick={handleEmailAuth}
            className="w-full bg-gradient-to-r from-purple-400 to-purple-600 text-white py-2 rounded-xl hover:from-purple-500 hover:to-purple-700 shadow mb-3 transition">
            {loginMode ? "Login" : "Sign Up"}
          </button>

          <p className="text-sm text-gray-600 mb-4">
            {loginMode ? "Don't have an account?" : "Already have an account?"}{" "}
            <button className="text-purple-600 font-bold hover:underline" onClick={() => setLoginMode(!loginMode)}>
              {loginMode ? "Sign Up" : "Login"}
            </button>
          </p>

          <div className="flex items-center my-2">
            <hr className="flex-1 border-gray-300" />
            <span className="px-2 text-gray-400 text-sm">OR</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          <button onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl shadow transition mb-2">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5"/>
            Sign in with Google
          </button>

          <button onClick={handleAppleSignIn}
            className="flex items-center justify-center gap-2 w-full bg-black hover:bg-gray-900 text-white py-2 rounded-xl shadow transition">
            Sign in with Apple
          </button>
        </div>
      </div>
    );
  }

  // ===== Main App =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-2 text-gray-800">
      <ToastContainer />
      <div className="max-w-6xl mx-auto flex gap-2">

        {/* Sidebar */}
        <div style={{ width: sessionWidth }} className="bg-gradient-to-b from-blue-100 to-blue-200 p-4 rounded-xl shadow h-[600px] flex flex-col relative">
          <h2 className="font-bold mb-2 text-gray-700">💬 Sessions</h2>
          <button onClick={createNewSession} className="mb-2 bg-blue-600 text-white py-1 rounded hover:bg-blue-700 shadow">+ New Chat</button>
          <button onClick={exportChatPDF} className="mb-2 bg-green-600 text-white py-1 rounded hover:bg-green-700 shadow">Export PDF</button>
          <ul className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {sessions.map((s) => (
              <li key={s.id}>
                <button onClick={() => setCurrentSession(s.id)}
                  className={`w-full text-left p-2 rounded transition-all ${s.id === currentSession ? "bg-blue-300 shadow" : "hover:bg-blue-200"}`}>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-600">{s.messageCount} messages</div>
                  <div className="text-xs text-gray-500">{formatDate(s.createdAt)}</div>
                </button>
              </li>
            ))}
          </ul>
          {window.innerWidth >= 768 && (
            <div onMouseDown={() => isResizingSession.current = true} className="absolute top-0 right-0 w-1 h-full cursor-ew-resize bg-blue-400/50 hover:bg-blue-500"/>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">🧠 EchoMe AI</h1>
            <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow">Sign Out</button>
          </div>

          <div ref={chatRef} className="bg-white rounded-2xl shadow-md p-4 mb-4 h-[500px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {chatMessages.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-1 mb-2">
                <div className="self-start bg-blue-100 text-blue-800 rounded-2xl p-3 max-w-[80%] shadow-md">
                  <span><strong>You:</strong> {m.message}</span>
                </div>
                <div className="self-end bg-purple-100 text-purple-800 rounded-2xl p-3 max-w-[80%] ml-auto shadow-md">
                  <strong>AI:</strong>
                  <div className="mt-1">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const content = String(children).replace(/\n$/, '');
                          return !inline ? (
                            <div className="relative bg-gray-900 text-gray-100 p-3 rounded mb-1 overflow-x-auto">
                              <SyntaxHighlighter language="javascript" style={atomDark} wrapLongLines>
                                {content}
                              </SyntaxHighlighter>
                              <CopyToClipboard text={content}>
                                <button className="absolute top-1 right-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded">Copy</button>
                              </CopyToClipboard>
                            </div>
                          ) : <code className="bg-gray-200 rounded px-1 py-0.5">{children}</code>;
                        },
                        a({node, ...props}) { return <a {...props} target="_blank" rel="noopener noreferrer">{props.children}</a>; }
                      }}
                    >
                      {m.aiResponse}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-center animate-pulse">AI is typing...</div>}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Type a message..."
              className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow">{loading ? "..." : "Send"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
