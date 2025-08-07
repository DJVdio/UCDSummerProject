import { Snackbar, Alert, AlertTitle } from '@mui/material';

export default function ErrorSnackbar({
  error,
  onClose,
  autoHideDuration = 6000,
  title = 'Request Failed',
}: {
  error: string | null;
  onClose: () => void;
  autoHideDuration?: number | null; // 传 null 则不自动消失
  title?: string;
}) {
  return (
    <Snackbar
      open={!!error}
      onClose={onClose}
      autoHideDuration={autoHideDuration ?? undefined}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="error" variant="filled" sx={{ width: '100%' }}>
        <AlertTitle>{title}</AlertTitle>
        {error || '出现未知错误，请稍后重试。'}
      </Alert>
    </Snackbar>
  );
}
