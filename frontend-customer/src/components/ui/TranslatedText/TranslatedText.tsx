/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';

interface TranslatedTextProps extends Omit<TypographyProps, 'children'> {
  textKey: string;
  namespace?: string;
  interpolationValues?: Record<string, unknown>;
  fallback?: string;
  component?: React.ElementType;
  children?: (translatedText: string) => React.ReactNode;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  textKey,
  namespace,
  interpolationValues,
  fallback,
  component,
  children,
  ...typographyProps
}) => {
  const { t } = useTranslation(namespace);

  const translatedText = t(textKey, {
    ...interpolationValues,
    defaultValue: fallback,
  });

  if (children) {
    return <>{children(translatedText)}</>;
  }

  const Component = component || Typography;

  return (
    <Component {...typographyProps}>
      {translatedText}
    </Component>
  );
};

export default TranslatedText;
