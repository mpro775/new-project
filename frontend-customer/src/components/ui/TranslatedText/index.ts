export { TranslatedText } from './TranslatedText';
export interface TranslatedTextProps {
  textKey: string;
  namespace?: string;
  interpolationValues?: Record<string, unknown>;
  fallback?: string;
  component?: React.ElementType;
  children?: (translatedText: string) => React.ReactNode;
}
