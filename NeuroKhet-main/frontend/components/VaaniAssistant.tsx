"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, User} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language: string;
  isVoice: boolean;
}

interface VaaniAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া' }
];

const getWelcomeMessage = (language: string = 'hi-IN'): string => {
  const welcomeMessages = {
    'hi-IN': 'नमस्ते! मैं वाणी हूँ, आपकी AI कृषि सहायक। मैं फसल रोग, बाजार की कीमतें, मौसम, और सरकारी योजनाओं के बारे में बता सकती हूँ। आप मुझसे कोई भी सवाल पूछ सकते हैं।',
    'en-IN': 'Hello! I am Vaani, your AI agricultural assistant. I can help with crop diseases, market prices, weather, and government schemes. Feel free to ask me anything about farming.',
    'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ವಾಣಿ, ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ನಾನು ಬೆಳೆ ರೋಗಗಳು, ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಹವಾಮಾನ, ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ।',
    'te-IN': 'నమస్కారం! నేను వాణి, మీ AI వ్యవసాయ సహాయకురాలను. పంట వ్యాధులు, మార్కెట్ ధరలు, వాతావరణం, మరియు ప్రభుత్వ పథకాల గురించి సహాయం చేయగలను।',
    'ta-IN': 'வணக்கம்! நான் வாணி, உங்கள் AI வேளாண் உதவியாளர். பயிர் நோய்கள், சந்தை விலைகள், வானிலை, மற்றும் அரசு திட்டங்கள் பற்றி உதவ முடியும்।'
  };
  
  return welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages['en-IN'];
};

export default function VaaniAssistant({ isOpen, onClose }: VaaniAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speakMessage = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    // Initialize Vaani with welcome message
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: getWelcomeMessage(selectedLanguage),
        timestamp: new Date(),
        language: selectedLanguage,
        isVoice: true
      };
      setMessages([welcomeMessage]);
      
      // Speak welcome message if voice is enabled
      speakMessage(welcomeMessage.content);
    }
  }, [isOpen, selectedLanguage, messages.length, speakMessage]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check microphone permissions and availability
    checkMicrophoneAccess();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup when modal closes
    if (!isOpen) {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      
      // Stop recording
      if (isListening && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsListening(false);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Reset processing state
      setIsProcessing(false);
      setError(null);
    }
  }, [isOpen, isListening]);

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const checkMicrophoneAccess = async () => {
    try {
      setMicPermission('checking');
      
      // Enhanced browser compatibility check
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasWebkitGetUserMedia = !!(navigator as unknown as { webkitGetUserMedia?: unknown }).webkitGetUserMedia;
      const hasMozGetUserMedia = !!(navigator as unknown as { mozGetUserMedia?: unknown }).mozGetUserMedia;
      const hasGetUserMedia = !!(navigator as unknown as { getUserMedia?: unknown }).getUserMedia;
      
      if (!hasMediaDevices && !hasWebkitGetUserMedia && !hasMozGetUserMedia && !hasGetUserMedia) {
        setError('Microphone access not supported in this browser. Please use Chrome, Firefox, or Safari.');
        setMicPermission('denied');
        return;
      }

      // Check if we're on HTTPS (required for Chrome)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('Microphone access requires HTTPS. Please use HTTPS or localhost for development.');
        setMicPermission('denied');
        return;
      }

      // Use modern API if available
      if (hasMediaDevices) {
        // Check current permission status
        if ('permissions' in navigator) {
          try {
            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermission(permission.state as 'granted' | 'denied' | 'prompt');
            
            if (permission.state === 'granted') {
              setError(null);
            } else if (permission.state === 'denied') {
              setError('Microphone access denied. Click the microphone icon in your browser address bar to allow access.');
            } else {
              // Permission is 'prompt' - user needs to grant permission
              setMicPermission('prompt');
              setError(null);
            }
            
            // Listen for permission changes
            permission.onchange = () => {
              setMicPermission(permission.state as 'granted' | 'denied' | 'prompt');
              if (permission.state === 'granted') {
                setError(null);
              }
            };
          } catch {
            console.log('Permission API not fully supported, will check on first use');
            setMicPermission('prompt');
            setError(null);
          }
        } else {
          // Fallback: try to access microphone directly
          try {
            const stream = await (navigator as Navigator).mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            setMicPermission('granted');
            setError(null);
          } catch (error: unknown) {
            setMicPermission('denied');
            
            if (error instanceof Error) {
              if (error.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access and try again.');
              } else if (error.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
              } else {
                setError('Microphone access not available. Please check your browser settings.');
              }
            }
          }
        }
      } else {
        // Legacy browser support
        setMicPermission('prompt');
        setError('Your browser has limited microphone support. Please update to the latest version for best experience.');
      }
    } catch (error) {
      console.error('Error checking microphone access:', error);
      setMicPermission('denied');
      setError('Failed to check microphone availability. Please refresh the page and try again.');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setError(null);
      
      // Enhanced getUserMedia with fallbacks
      let stream: MediaStream;
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern API
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      } else {
        // Legacy API fallback
        const getUserMedia = (navigator as unknown as { 
          getUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
          webkitGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
          mozGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
        }).getUserMedia || 
        (navigator as unknown as { webkitGetUserMedia?: unknown }).webkitGetUserMedia || 
        (navigator as unknown as { mozGetUserMedia?: unknown }).mozGetUserMedia;
        
        if (!getUserMedia) {
          throw new Error('getUserMedia not supported');
        }
        
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (getUserMedia as (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void)
            .call(navigator, { audio: true }, resolve, reject);
        });
      }
      
      // Stop the stream immediately as we just wanted to get permission
      stream.getTracks().forEach(track => track.stop());
      
      setMicPermission('granted');
      setError(null);
      
      return true;
    } catch (error: unknown) {
      console.error('Microphone permission error:', error);
      setMicPermission('denied');
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone access denied. Please click the microphone icon in your browser address bar and allow access.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          setError('Microphone is being used by another application. Please close other apps and try again.');
        } else if (error.name === 'SecurityError') {
          setError('Microphone access blocked due to security restrictions. Please ensure you are using HTTPS.');
        } else {
          setError(`Microphone access failed: ${error.message}. Please check your browser settings.`);
        }
      }
      
      return false;
    }
  };

  const startListening = async () => {
    try {
      setError(null);
      
      // Request permission if not granted
      if (micPermission !== 'granted') {
        const permitted = await requestMicrophonePermission();
        if (!permitted) return;
      }

      setIsListening(true);
      audioChunksRef.current = [];

      // Enhanced getUserMedia with better constraints
      let stream: MediaStream;
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            sampleRate: { ideal: 16000 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          } 
        });
      } else {
        // Legacy fallback
        const getUserMedia = (navigator as unknown as { 
          getUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
          webkitGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
          mozGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void;
        }).getUserMedia || 
        (navigator as unknown as { webkitGetUserMedia?: unknown }).webkitGetUserMedia || 
        (navigator as unknown as { mozGetUserMedia?: unknown }).mozGetUserMedia;
        
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (getUserMedia as (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void)
            .call(navigator, { audio: true }, resolve, reject);
        });
      }

      streamRef.current = stream;

      // Enhanced MediaRecorder support check
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/ogg'
      ];
      
      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported audio recording format found');
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        processVoiceInput(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        setIsListening(false);
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      
    } catch (error: unknown) {
      console.error('Error starting voice recording:', error);
      setIsListening(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else if (error.name === 'NotReadableError') {
          setError('Microphone is busy. Please close other applications using the microphone.');
        } else if (error.name === 'SecurityError') {
          setError('Security error: Please ensure you are using HTTPS or localhost.');
        } else {
          setError(`Recording failed: ${error.message}`);
        }
      }
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const processVoiceInput = async (audioBlob?: Blob) => {
    setIsProcessing(true);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // For now, show a placeholder message since we don't have speech-to-text implemented
      // In future, you would send audioBlob to a speech-to-text service
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: audioBlob ? `Voice message received (${(audioBlob.size / 1024).toFixed(1)}KB audio)` : 'Voice message received (speech-to-text processing...)',
        timestamp: new Date(),
        language: selectedLanguage,
        isVoice: true
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Get response from Vaani with cancellation support
      const response = await getVaaniResponse('Hello, can you help me with farming questions?');
      
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        language: selectedLanguage,
        isVoice: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (!abortControllerRef.current?.signal.aborted) {
        speakMessage(response);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Voice processing cancelled');
        return;
      }
      console.error('Error processing voice input:', error);
      setError('Failed to process voice input');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsProcessing(false);
      }
      abortControllerRef.current = null;
    }
  };

  const getVaaniResponse = async (query: string): Promise<string> => {
    try {
      const response = await fetch('/api/vaani-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          language: selectedLanguage,
          conversationHistory: messages.slice(-6) // Last 6 messages for context
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      console.error('Error getting Vaani response:', error);
      return getFallbackResponse();
    }
  };

  const getFallbackResponse = (): string => {
    const fallbacks = {
      'hi-IN': 'मुझे खुशी होगी आपकी मदद करने में। कृपया अपना सवाल फिर से पूछें।',
      'en-IN': 'I am happy to help you. Please ask your question again.',
      'kn-IN': 'ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನನಗೆ ಸಂತೋಷವಾಗಿದೆ। ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಕೇಳಿ।'
    };
    
    return fallbacks[selectedLanguage as keyof typeof fallbacks] || fallbacks['en-IN'];
  };

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Cancel ongoing requests before closing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">वा</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vaani - वाणी</h2>
              <p className="text-sm text-gray-600">Your AI Agricultural Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                micPermission === 'granted' ? 'bg-green-500' : 
                micPermission === 'denied' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`}></div>
              <span className="text-gray-600">
                {micPermission === 'granted' ? 'Microphone Ready' : 
                 micPermission === 'denied' ? 'Microphone Access Denied' : 
                 micPermission === 'checking' ? 'Checking Microphone...' :
                 'Microphone Permission Required'}
              </span>
              {(micPermission === 'denied' || micPermission === 'prompt') && (
                <button
                  onClick={requestMicrophonePermission}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  {micPermission === 'denied' ? 'Retry Access' : 'Request Access'}
                </button>
              )}
            </div>
            <span className="text-purple-600 font-medium">
              Speaking in {currentLanguage?.nativeName}
            </span>
          </div>
          
          {/* Browser compatibility info */}
          {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Note:</strong> Microphone requires HTTPS. For development, use localhost or enable HTTPS.
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white font-bold text-sm">वा</span>
                )}
              </div>
              
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  {message.isVoice && (
                    <div className="flex items-center mt-1 space-x-1">
                      <Volume2 className="w-3 h-3 opacity-60" />
                      <span className="text-xs opacity-60">Voice message</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">वा</span>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls */}
        <div className="p-6 border-t border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              {micPermission === 'denied' && (
                <div className="mt-2">
                  <button
                    onClick={requestMicrophonePermission}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4">
            {/* Main Voice Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={micPermission === 'checking' || isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse'
                  : micPermission === 'granted'
                  ? 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105 shadow-lg'
                  : micPermission === 'denied'
                  ? 'bg-red-400 text-white cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            
            {/* Stop Speaking Button */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <VolumeX className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {isListening 
                ? `Listening in ${currentLanguage?.nativeName}... Tap to stop`
                : micPermission === 'granted'
                ? `Tap to speak in ${currentLanguage?.nativeName}`
                : micPermission === 'denied'
                ? 'Microphone access required to use voice features'
                : 'Checking microphone availability...'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {micPermission === 'granted' 
                ? 'Ask about crops, prices, weather, or government schemes'
                : 'Please allow microphone access when prompted'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
