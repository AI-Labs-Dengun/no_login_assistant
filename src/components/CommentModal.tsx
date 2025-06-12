import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useLanguage } from '../lib/LanguageContext';
import { useTranslation } from '../lib/i18n';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  message?: { id: string; content: string };
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  message,
}) => {
  const [comment, setComment] = React.useState('');
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(comment);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#f8f9fa] dark:bg-[#1a1a2e] bg-opacity-90 border border-gray-300 dark:border-white/30 rounded-2xl p-6 w-full max-w-md backdrop-blur-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-white transition-colors"
          aria-label={t('common.cancel')}
        >
          <FaTimes className="text-xl text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('chat.addComment')}</h2>
        {message && (
          <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 text-sm">
            {message.content}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded bg-transparent text-gray-900 dark:text-white border-gray-300 dark:border-white/30 focus:border-gray-900 dark:focus:border-white focus:ring-0 placeholder-gray-500 dark:placeholder-white/80"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('chat.writeComment')}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-white"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-gray-900 text-white font-semibold hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors duration-200"
            >
              {t('chat.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal; 