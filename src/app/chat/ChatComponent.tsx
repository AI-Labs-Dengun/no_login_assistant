"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaRobot, FaUserCircle, FaRegThumbsUp, FaRegThumbsDown, FaRegCommentDots, FaVolumeUp, FaPaperPlane, FaRegSmile, FaMicrophone, FaPause, FaPlay, FaWhatsapp } from 'react-icons/fa';
import { useTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../../lib/LanguageContext';
import { useTranslation, Language, languageNames, translations, detectMessageLanguage } from '../../lib/i18n';
import TypewriterEffect from '../../components/TypewriterEffect';
import CommentModal from '../../components/CommentModal';
import VoiceModal from '../../components/VoiceModal';
import { detectContactInfo } from '../../lib/contactDetector';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';
import { Toaster } from 'react-hot-toast';
import showToast from '../../lib/toast';
import TypingIndicator from '../../components/TypingIndicator';
import ReactMarkdown from 'react-markdown';

const EmojiPicker = dynamic(() => import('@emoji-mart/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-[350px] h-[400px] bg-white dark:bg-[#23234a] rounded-xl" />
});

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  audioUrl?: string;
}

const ChatComponent = () => {
  const { dark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation(language as Language);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [commentModal, setCommentModal] = useState<{ open: boolean, message?: { id: string, content: string } }>({ open: false });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEmojiButtonActive, setIsEmojiButtonActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [voiceMode, setVoiceMode] = useState<'idle' | 'recording' | 'ai-speaking'>('idle');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [voiceModalMode, setVoiceModalMode] = useState<'ai-speaking' | 'ready-to-record' | 'recording' | 'thinking' | 'loading'>('ready-to-record');
  const [greetingLoading, setGreetingLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const [tooltips, setTooltips] = useState<string[]>([]);
  const [showTooltips, setShowTooltips] = useState(true);
  const [showTooltipsModal, setShowTooltipsModal] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState<string | null>(null);
  const voiceModalRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const greetingLoadedRef = useRef(false);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(atBottom);
  };

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  React.useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  // Carregar mensagem de boas-vindas quando o componente for montado
  useEffect(() => {
    console.log('[Greeting useEffect] messages.length:', messages.length, 'greetingLoading:', greetingLoading, 'greetingLoadedRef:', greetingLoadedRef.current, 'language:', language);
    if (messages.length === 0 && !greetingLoading && !greetingLoadedRef.current) {
      setGreetingLoading(true);
      greetingLoadedRef.current = true;
      (async () => {
        let greetingMsg = null;
        try {
          const [instructionsRes, knowledgeRes] = await Promise.all([
            fetch('/AI_INSTRUCTIONS.md'),
            fetch('/AI_KNOWLEDGE.md'),
          ]);
          const instructionsText = await instructionsRes.text();
          const knowledgeText = await knowledgeRes.text();
          const greetingPrompt = `Generate a creative, warm, and original greeting for a new user in ${language}. Use the INSTRUCTIONS to define the tone and style of the message, and the KNOWLEDGE BASE to incorporate specific information about Dengun and its services. Be original and do not copy any examples from the instructions. The greeting should reflect Dengun's professional and welcoming personality, mentioning some of the main services and inviting the user to explore how we can help. Keep your answer very short (1-2 sentences).`;
          const res = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: greetingPrompt }),
          });
          const data = await res.json();
          greetingMsg = data.reply && data.reply.trim() ? data.reply : t('chat.greeting');
        } catch (err) {
          console.error('Erro ao carregar mensagem de boas-vindas:', err);
          greetingMsg = t('chat.greeting');
        } finally {
          setMessages([
            {
              id: 'welcome',
              content: greetingMsg,
              role: 'assistant',
              created_at: new Date().toISOString(),
            },
          ]);
          setHasUserInteracted(false);
          setGreetingLoading(false);
        }
      })();
    }
  }, [language, messages.length, greetingLoading]);

  // Carregar sugestões
  useEffect(() => {
    try {
      // Acessa diretamente o array de sugestões no objeto de traduções
      const tooltipsArray = translations[language as Language]?.chat?.tooltips;
      
      if (Array.isArray(tooltipsArray) && tooltipsArray.length > 0) {
        const shuffled = [...tooltipsArray].sort(() => 0.5 - Math.random());
        setTooltips(shuffled.slice(0, 4));
      } else {
        console.error('Não foi possível carregar as sugestões para o idioma:', language);
        setTooltips([]);
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      setTooltips([]);
    }
  }, [language]);

  // Mostrar modal quando as sugestões estiverem carregadas e a mensagem de boas-vindas for exibida
  useEffect(() => {
    // Só verificamos se devemos exibir o modal quando houver tooltips, mensagens,
    // e o usuário ainda não interagiu
    if (tooltips.length > 0 && messages.length > 0 && !hasUserInteracted && !greetingLoading) {
      
      // Em dispositivos móveis, mostrar o modal automaticamente
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const timer = setTimeout(() => {
          if (!hasUserInteracted) { // Verificar novamente antes de exibir
            setShowTooltipsModal(false);
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [tooltips, messages, hasUserInteracted, greetingLoading]);

  // Detectar redimensionamento da tela para ajustar a exibição das sugestões
  useEffect(() => {
    const handleResize = () => {
      if (tooltips.length > 0 && messages.length > 0 && !hasUserInteracted) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setShowTooltipsModal(true);
        } else {
          setShowTooltipsModal(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tooltips, messages, hasUserInteracted]);

  const handleFirstInteraction = () => {
    setHasUserInteracted(true);
    setShowTooltipsModal(false);
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    console.log('Toggle Audio - Current state:', { isAudioPlaying, isAudioPaused });
    
    if (isAudioPaused) {
      console.log('Resuming audio playback');
      audioRef.current.play().catch(err => {
        console.error('Error resuming audio:', err);
      });
    } else {
      console.log('Pausing audio playback');
      audioRef.current.pause();
    }
  };

  const playTTS = async (text: string, messageId: string, onEnd?: () => void, forcedLanguage?: Language) => {
    if (typeof window === 'undefined') return;
    
    const loadingToast = showToast.loading('Carregando áudio...');
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Usa o idioma forçado ou detecta o idioma do texto
      const detectedLanguage = forcedLanguage || detectMessageLanguage(text);
      
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          language: detectedLanguage 
        }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsAudioPlaying(false);
        setIsAudioPaused(false);
        setCurrentPlayingMessageId(null);
        if (onEnd) onEnd();
      };
      
      audio.onplay = () => {
        setIsAudioPlaying(true);
        setIsAudioPaused(false);
        setCurrentPlayingMessageId(messageId);
      };
      
      audio.onpause = () => {
        setIsAudioPlaying(false);
        setIsAudioPaused(true);
      };
      
      await audio.play();
      showToast.dismiss(loadingToast);
    } catch (err) {
      console.error('TTS error:', err);
      setIsAudioPlaying(false);
      setIsAudioPaused(false);
      setCurrentPlayingMessageId(null);
      showToast.error('Erro ao carregar áudio');
      if (onEnd) onEnd();
    }
  };

  const speakBotMessage = async (text: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const sendEmailWithConversation = async (email: string | null, phone: string | null) => {
    try {
      const conversation = messages.map(msg => 
        `${msg.role === 'user' ? 'Cliente' : 'Assistente'}: ${msg.content}`
      ).join('\n\n');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          conversation,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar email');
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    if (greetingLoading) return;
    e.preventDefault();
    handleFirstInteraction();
    if (!newMessage.trim()) return;

    // Detecta informações de contato na mensagem
    const { email, phone } = detectContactInfo(newMessage);
    
    // Detecta o idioma da mensagem do usuário
    const detectedLanguage = detectMessageLanguage(newMessage);
    
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      content: newMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    setLoading(true);
    setIsTyping(true);

    // Se detectou email ou telefone, envia o email
    if (email || phone) {
      await sendEmailWithConversation(email, phone);
    }

    // Prepara o histórico da conversa para enviar ao ChatGPT (inclui a mensagem atual do usuário)
    const conversationHistory = [
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: newMessage }
    ];

    const prompt = `${newMessage}\n\nIMPORTANT: Respond EXACTLY in the SAME LANGUAGE as this message. Do not translate or change the language. Keep your response short and concise.`;
    try {
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          conversationHistory 
        }),
      });
      const data = await res.json();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          content: data.reply || t('chat.greeting'),
          role: 'assistant',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-error-' + Date.now(),
          content: t('common.error'),
          role: 'assistant',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, type: 'like' | 'dislike', content: string) => {
    if (greetingLoading) return;
    setFeedback((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? undefined : type,
    }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type, content }),
      });
    } catch (e) {}
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = 'pt-PT';
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang?.toLowerCase().startsWith('pt') &&
        (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft'))
      );
      const fallback = voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
      utter.voice = preferred || fallback || null;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleComment = async (messageId: string, content: string, comment: string) => {
    if (greetingLoading) return;
    try {
      await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content, comment }),
      });
      await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: comment }),
      });
    } catch (e) {}
  };

  const handleEmojiButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !showEmojiPicker;
    setShowEmojiPicker(newState);
    setIsEmojiButtonActive(newState);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) &&
          emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setIsEmojiButtonActive(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleToggleRecord = () => {
    console.log('handleToggleRecord called, current mode:', voiceModalMode);
    handleFirstInteraction();
    if (voiceModalMode === 'ready-to-record') {
      startRecording();
    } else if (voiceModalMode === 'recording') {
      stopRecording();
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    if (greetingLoading) return;
    setVoiceModalMode('thinking');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Transcription result:', data);
      if (data.text) {
        // Use the language detected by the transcription API
        const detectedLanguage = (data.language as Language) || detectMessageLanguage(data.text);
        
        const userMsg: Message = {
          id: 'user-' + Date.now(),
          content: data.text,
          role: 'user' as const,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        try {
          // Prepare conversation history for ChatGPT (includes transcribed message)
          const conversationHistory = [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user' as const, content: data.text }
          ];

          // Ensure prompt is in the same language as the message
          const prompt = `${data.text}\n\nIMPORTANT: Respond EXACTLY in the SAME LANGUAGE as this message. Do not translate or change the language. Keep your response short and concise.`;

          const res = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: prompt,
              conversationHistory 
            }),
          });
          const aiData = await res.json();
          const botMessageId = 'bot-' + Date.now();
          const botMessage = {
            id: botMessageId,
            content: aiData.reply || 'Sorry, I could not respond now.',
            role: 'assistant' as const,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botMessage]);
          
          // Keep showing thinking screen while preparing TTS
          setVoiceModalMode('thinking');
          setVoiceModalOpen(true);
          
          // Automatically play the bot's response audio in the same language
          if (aiData.reply) {
            // Set AI speaking mode and message only when TTS is about to start
            setCurrentAiMessage(botMessage.content);
            await playTTS(aiData.reply, botMessageId, () => {
              // After TTS finishes, set mode back to ready-to-record
              setVoiceModalMode('ready-to-record');
            }, detectedLanguage);
            // Set AI speaking mode right before TTS starts
            setVoiceModalMode('ai-speaking');
          }
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-error-' + Date.now(),
              content: 'Error connecting to ChatGPT.',
              role: 'assistant' as const,
              created_at: new Date().toISOString(),
            },
          ]);
          setVoiceModalMode('ready-to-record');
        } finally {
          setLoading(false);
        }
      } else {
        setVoiceModalMode('ready-to-record');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setVoiceModalMode('ready-to-record');
    }
  };

  const startRecording = async () => {
    console.log('startRecording called');
    if (typeof window === 'undefined') return;
    try {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
        setIsAudioPaused(false);
        setCurrentPlayingMessageId(null);
      }

      setVoiceModalMode('recording');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(audioBlob));
        handleAudioSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Recording error:', err);
      setVoiceModalMode('ready-to-record');
    }
  };

  const stopRecording = () => {
    console.log('stopRecording called');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setVoiceModalMode('thinking');
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceModalClose = () => {
    setVoiceModalOpen(false);
    setVoiceModalMode('ready-to-record');
    setVoiceMode('idle');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const typeSpeed = 20;
      const startDelay = 100;
      const msg = messages[messages.length - 1].content || '';
      setIsTypewriterActive(true);
      const timeout = setTimeout(() => {
        setIsTypewriterActive(false);
      }, startDelay + msg.length * typeSpeed);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  useEffect(() => {
    if (isTypewriterActive && isNearBottom) {
      const interval = setInterval(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTypewriterActive, isNearBottom]);

  const handleTooltipClick = async (tooltip: string) => {
    if (greetingLoading) return;
    handleFirstInteraction();
    setIsTyping(true);
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      content: tooltip,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    const prompt = `${tooltip}\n\nPlease answer ONLY in ${languageNames[language as Language] || 'English'}, regardless of the language of the question. Do not mention language or your ability to assist in other languages. Keep your answer short and concise.`;
    try {
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          content: data.reply || t('chat.greeting'),
          role: 'assistant',
          created_at: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-error-' + Date.now(),
          content: t('common.error'),
          role: 'assistant',
          created_at: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceMode = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.role === 'assistant') {
      setCurrentAiMessage(message.content);
      setVoiceModalOpen(true);
      setVoiceModalMode('ai-speaking');
    } else {
      setVoiceModalOpen(true);
      setVoiceModalMode('ready-to-record');
    }
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#1a1a2e] min-h-screen flex items-center justify-center">
      <Toaster position="bottom-right" />
      <div className="w-full h-screen md:h-[90vh] md:max-w-2xl flex flex-col rounded-none md:rounded-3xl shadow-2xl border border-gray-200 dark:border-white/30">
        <header className="p-4 md:p-4 flex justify-between items-center relative border-b border-gray-200 dark:border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {dark ? (
                <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
          <a
            href="https://wa.me/351966915976"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-green-500 dark:hover:text-green-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span className="hidden md:inline text-sm">+351 966 915 976</span>
          </a>
        </header>
        <main
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
          {greetingLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
              <span className="ml-3 text-gray-900 dark:text-white/80">{t('chat.greetingLoading')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col items-end mr-2 justify-center">
                      <FaRobot className="text-3xl text-gray-900 dark:text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl p-4 border-[0.5px] border-gray-200 dark:border-white text-gray-900 dark:text-white bg-transparent max-w-[90%] md:max-w-[90%] min-w-[100px] text-base relative ${msg.role === 'user' ? 'ml-2' : 'mr-2'}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <span {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-5 pb-1 relative justify-between">
                      <div className="flex items-center gap-2">
                        {msg.role === 'assistant' && (
                          <>
                            <button
                              className={`transition-colors ${feedback[msg.id] === 'like' ? 'text-green-400' : 'text-gray-900 dark:text-white'} hover:text-green-400`}
                              onClick={() => handleFeedback(msg.id, 'like', msg.content)}
                            >
                              <FaRegThumbsUp className="text-lg" />
                            </button>
                            <button
                              className={`transition-colors ${feedback[msg.id] === 'dislike' ? 'text-red-400' : 'text-gray-900 dark:text-white'} hover:text-red-400`}
                              onClick={() => handleFeedback(msg.id, 'dislike', msg.content)}
                            >
                              <FaRegThumbsDown className="text-lg" />
                            </button>

                            <button
                              className={`hover:text-gray-300 transition-colors`}
                              onClick={async () => {
                                if (currentPlayingMessageId === msg.id) {
                                  toggleAudioPlayback();
                                } else {
                                  setTtsLoadingMsgId(msg.id);
                                  await playTTS(msg.content, msg.id, () => setTtsLoadingMsgId(null), msg.role === 'assistant' ? language as Language : undefined);
                                  setTtsLoadingMsgId(null);
                                }
                              }}
                              disabled={ttsLoadingMsgId === msg.id}
                            >
                              {ttsLoadingMsgId === msg.id ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 inline-block"></span>
                              ) : currentPlayingMessageId === msg.id && isAudioPaused ? (
                                <FaPlay className="text-lg text-gray-900 dark:text-white" />
                              ) : currentPlayingMessageId === msg.id && isAudioPlaying ? (
                                <FaPause className="text-lg text-gray-900 dark:text-white" />
                              ) : (
                                <FaVolumeUp className="text-lg text-gray-900 dark:text-white" />
                              )}
                            </button>
                            <button className="hover:text-gray-300 transition-colors" onClick={() => setCommentModal({ open: true, message: { id: msg.id, content: msg.content } })}>
                              <FaRegCommentDots className="text-lg text-gray-900 dark:text-white" />
                            </button>
                          </>
                        )}
                      </div>
                      <span className="text-xs opacity-60 whitespace-nowrap">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex flex-col items-end ml-2 justify-center">
                      <FaUserCircle className="text-3xl text-gray-900 dark:text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-end mr-2 justify-center">
                    <FaRobot className="text-3xl text-gray-900 dark:text-white" />
                  </div>
                  <div className="rounded-xl p-4 border-[0.5px] border-gray-200 dark:border-white text-gray-900 dark:text-white bg-transparent max-w-[90%] md:max-w-[90%] min-w-[100px] text-base relative mr-2">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Sugestões */}
        {tooltips.length > 0 && !hasUserInteracted && (
          <div className="w-full px-6">
            <div className="w-full border-t border-gray-200 dark:border-white/30 mb-4" />
            <div className="flex flex-col gap-2 mb-4 items-center w-full md:hidden">
              <button
                className="w-full flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/20 text-gray-900 dark:text-white/90 hover:bg-gray-300 transition-colors text-center"
                onClick={() => {
                  console.log('Botão de sugestões clicado');
                  setShowTooltipsModal(true);
                }}
              >
                {t('chat.suggestions')}
              </button>
            </div>
            <div className="hidden md:flex flex-col gap-2 mb-4 items-center w-full">
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                {tooltips.slice(0, 2).map((tip, idx) => (
                  <button
                    key={idx}
                    className="flex-1 text-sm px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors"
                    onClick={() => handleTooltipClick(tip)}
                  >
                    {tip}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                {tooltips.slice(2, 4).map((tip, idx) => (
                  <button
                    key={idx+2}
                    className="flex-1 text-sm px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors"
                    onClick={() => handleTooltipClick(tip)}
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
            {showTooltipsModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    console.log('Modal clicado fora');
                    setShowTooltipsModal(false);
                  }
                }}
              >
                <div className="bg-gray-200 dark:bg-white/20 rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center border border-gray-200 dark:border-white/30 backdrop-blur-md relative">
                  <button
                    className="absolute top-4 right-4 text-gray-900 dark:text-white text-2xl"
                    onClick={() => {
                      console.log('Botão de fechar modal clicado');
                      setShowTooltipsModal(false);
                    }}
                    aria-label="Close"
                    type="button"
                  >
                    &times;
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 drop-shadow">{t('chat.suggestions')}</h2>
                  <div className="flex flex-col gap-3 w-full">
                    {tooltips.map((tip, idx) => (
                      <button
                        key={idx}
                        className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors text-center"
                        onClick={() => { 
                          console.log('Sugestão clicada:', tip);
                          handleTooltipClick(tip); 
                        }}
                      >
                        {tip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <footer className="w-full p-3">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-transparent rounded-2xl px-4 py-2 shadow-md border border-gray-200 dark:border-white/30 relative"
          >
            <div className="flex items-center w-full">
              <button
                ref={emojiButtonRef}
                type="button"
                className={`hidden md:inline-flex flex items-center justify-center relative overflow-hidden text-xl text-gray-900 dark:text-white hover:bg-gray-300 focus:bg-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 mr-2 rounded-full p-2 transition-colors ${isEmojiButtonActive ? 'text-blue-400' : ''}`}
                onClick={handleEmojiButtonClick}
                tabIndex={-1}
              >
                <FaRegSmile className="text-xl" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('chat.typeMessage')}
                className="flex-1 bg-transparent outline-none px-2 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
                style={{ background: 'transparent' }}
              />
              <button
                type="submit"
                className="flex items-center justify-center relative overflow-hidden text-xl text-gray-900 dark:text-white hover:bg-gray-300 focus:bg-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 disabled:opacity-50 ml-2 rounded-full p-2 transition-colors"
                disabled={!newMessage.trim() || loading}
              >
                <FaPaperPlane className="text-xl" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center relative overflow-hidden text-xl text-gray-900 dark:text-white hover:bg-gray-300 focus:bg-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ml-2 rounded-full p-2 transition-colors"
                onClick={() => {
                  setVoiceModalOpen(true);
                  setVoiceModalMode('ready-to-record');
                }}
              >
                <FaMicrophone className="text-xl" />
              </button>
            </div>
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-50 emoji-picker-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-200 dark:bg-white/20 rounded-xl shadow-lg">
                  <EmojiPicker
                    data={data}
                    theme={dark ? 'dark' : 'light'}
                    onEmojiSelect={(e: any) => {
                      insertEmoji(e.native);
                    }}
                    previewPosition="none"
                    skinTonePosition="none"
                    searchPosition="none"
                  />
                </div>
              </div>
            )}
          </form>
        </footer>
        <div className="w-full px-6 pb-2">
          <p className="text-xs text-gray-900 dark:text-white/60 text-center">{t('chat.disclaimer')}</p>
        </div>
      </div>
      <CommentModal
        isOpen={commentModal.open}
        onClose={() => setCommentModal({ open: false })}
        onSubmit={(comment) => {
          if (commentModal.message) {
            handleComment(commentModal.message.id, commentModal.message.content, comment);
          }
        }}
      />
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={handleVoiceModalClose}
        onSubmit={handleAudioSubmit}
        mode={voiceModalMode}
        onToggleRecord={handleToggleRecord}
        modalRef={voiceModalRef}
        aiMessage={currentAiMessage}
      />
    </div>
  );
};

export default ChatComponent; 