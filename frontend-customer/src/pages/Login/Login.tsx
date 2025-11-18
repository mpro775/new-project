import React from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { Input } from '@/components/ui';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const {
    login,
    verifyTwoFactorCode,
    sendTwoFactorCode,
    isLoading,
    requiresTwoFactor,
    twoFactorMethod
  } = useAuth();
  const [error, setError] = React.useState<string>('');

  const loginSchema = z.object({
    username: z.string().min(1, t('validation.required')),
    password: z.string().min(6, t('validation.minLength', { min: 6 })),
  });

  const twoFactorSchema = z.object({
    twoFactorCode: z.string().min(6, t('validation.minLength', { min: 6 })).max(6, t('validation.maxLength', { max: 6 })),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data);
    } catch {
      setError('فشل تسجيل الدخول. يرجى التحقق من البيانات المدخلة.');
    }
  };

  const onTwoFactorSubmit = async (data: TwoFactorFormData) => {
    try {
      setError('');
      await verifyTwoFactorCode(data.twoFactorCode);
    } catch {
      setError('رمز الأمان غير صحيح. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSendTwoFactorCode = async () => {
    if (!twoFactorMethod) return;

    try {
      if (twoFactorMethod === 'sms') {
        await sendTwoFactorCode('sms');
      } else if (twoFactorMethod === 'email') {
        await sendTwoFactorCode('email');
      }
    } catch {
      setError('فشل في إرسال رمز الأمان. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            {requiresTwoFactor ? t('auth.twoFactor.title', 'التحقق من الهوية') : t('auth.login.title')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {requiresTwoFactor
              ? t('auth.twoFactor.description', 'أدخل رمز الأمان المرسل إليك')
              : t('app.description')
            }
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {requiresTwoFactor ? (
            // 2FA Form
            <Box
              component="form"
              onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)}
              sx={{ mt: 1, width: '100%' }}
            >
              <Input
                margin="normal"
                required
                fullWidth
                id="twoFactorCode"
                label={t('auth.twoFactor.code', 'رمز الأمان')}
                placeholder="000000"
                autoFocus
                {...twoFactorForm.register('twoFactorCode')}
                error={!!twoFactorForm.formState.errors.twoFactorCode}
                helperText={twoFactorForm.formState.errors.twoFactorCode?.message || ''}
              />

              {twoFactorMethod && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  {t('auth.twoFactor.sentTo', 'تم إرسال الرمز إلى')} {twoFactorMethod === 'sms' ? t('auth.twoFactor.phone', 'رقم الهاتف') : t('auth.twoFactor.email', 'البريد الإلكتروني')}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? t('auth.twoFactor.verifying', 'جارٍ التحقق...') : t('auth.twoFactor.verify', 'تحقق')}
              </Button>

              {twoFactorMethod && (
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  onClick={handleSendTwoFactorCode}
                  disabled={isLoading}
                >
                  {t('auth.twoFactor.resend', 'إعادة إرسال الرمز')}
                </Button>
              )}
            </Box>
          ) : (
            // Login Form
            <Box
              component="form"
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              sx={{ mt: 1, width: '100%' }}
            >
              <Input
                margin="normal"
                required
                fullWidth
                id="username"
                label={t('auth.login.username')}
                autoComplete="username"
                autoFocus
                {...loginForm.register('username')}
                error={!!loginForm.formState.errors.username}
                helperText={loginForm.formState.errors.username?.message || ''}
              />

              <Input
                margin="normal"
                required
                fullWidth
                label={t('auth.login.password')}
                type="password"
                id="password"
                autoComplete="current-password"
                showPasswordToggle
                {...loginForm.register('password')}
                error={!!loginForm.formState.errors.password}
                helperText={loginForm.formState.errors.password?.message || ''}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? t('auth.login.loggingIn') : t('auth.login.submit')}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
