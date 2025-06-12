import React, { RefObject } from 'react';
import { FaMicrophone, FaStop, FaTimes, FaSpinner, FaRobot } from 'react-icons/fa';
import { useLanguage } from '../lib/LanguageContext';
import { useTranslation } from '../lib/i18n';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (audioBlob: Blob) => void;
  mode: 'ai-speaking' | 'ready-to-record' | 'recording' | 'thinking' | 'loading';
  onToggleRecord: () => void;
  modalRef: RefObject<HTMLDivElement>;
  aiMessage?: string;
}

const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  onToggleRecord,
  modalRef,
  aiMessage,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const renderAISpeakingScreen = () => (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-2xl font-bold text-white text-center drop-shadow">
        {language === 'pt' ? 'Assistente está falando' : 'Assistant is speaking'}
      </h2>

      <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center relative overflow-visible backdrop-blur-sm">
        <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-voice-wave1 opacity-50" />
        <span className="absolute inset-0 rounded-full border-2 border-blue-300 animate-voice-wave2 opacity-30" />
        <span className="absolute inset-0 rounded-full border-2 border-blue-200 animate-voice-wave3 opacity-20" />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center z-10 shadow-lg">
          <FaRobot className="text-white text-4xl" />
        </div>
      </div>

      {aiMessage && (
        <div className="text-white/90 text-center text-lg font-medium max-h-32 overflow-y-auto bg-white/5 p-4 rounded-xl backdrop-blur-sm">
          {aiMessage}
        </div>
      )}
    </div>
  );

  const renderRecordingScreen = () => (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-2xl font-bold text-white text-center drop-shadow">
        {mode === 'recording' 
          ? (language === 'pt' ? 'Gravando sua mensagem...' : 'Recording your message...')
          : (language === 'pt' ? 'Toque para começar a gravar' : 'Tap to start recording')}
      </h2>

      <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center relative overflow-visible backdrop-blur-sm">
        {mode === 'recording' ? (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-voice-wave1 opacity-50" />
            <span className="absolute inset-0 rounded-full border-2 border-red-300 animate-voice-wave2 opacity-30" />
            <span className="absolute inset-0 rounded-full border-2 border-red-200 animate-voice-wave3 opacity-20" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg animate-pulse">
              <FaStop className="text-white text-4xl" />
            </div>
          </>
        ) : mode === 'thinking' ? (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <FaSpinner className="text-white text-4xl animate-spin" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <FaMicrophone className="text-white text-4xl" />
          </div>
        )}
      </div>

      {(mode === 'ready-to-record' || mode === 'recording') && (
        <button
          onClick={onToggleRecord}
          className={`px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 w-auto shadow-lg hover:shadow-xl hover:scale-105`}
        >
          {mode === 'recording' 
            ? (language === 'pt' ? 'Parar gravação' : 'Stop recording')
            : (language === 'pt' ? 'Iniciar gravação' : 'Start recording')}
        </button>
      )}

      {mode === 'thinking' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/90 text-center text-lg font-medium">
            {language === 'pt' ? 'Processando sua mensagem...' : 'Processing your message...'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div ref={modalRef} className="bg-[#f8f9fa] dark:bg-[#1a1a2e] bg-opacity-95 border border-white/30 rounded-3xl p-8 w-full max-w-md backdrop-blur-md relative shadow-2xl animate-scaleIn">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <FaTimes className="text-xl" />
        </button>

        {mode === 'ai-speaking' ? renderAISpeakingScreen() : renderRecordingScreen()}
      </div>
    </div>
  );
};

export default VoiceModal; 