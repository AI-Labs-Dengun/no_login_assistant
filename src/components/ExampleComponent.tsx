'use client';

import { useLanguage } from '../lib/LanguageContext';
import { useTranslation } from '../lib/i18n';

export function ExampleComponent() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <div>
      <h1>{t('settings.title')}</h1>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
      <p>{t('chat.typeMessage')}</p>
    </div>
  );
} 