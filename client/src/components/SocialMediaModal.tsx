import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';

type Prop = {
    open: boolean;
    onClose: () => void;
    message: string;
  };

export const SocialMediaModal = ({ open, onClose, message }: Prop) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share Your Success!</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Let your friends know how easy it is to convert crypto to local currency with Chikwama!
        </DialogContentText>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {message}
        </Typography>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
                '_blank'
              )
            }
          >
            Share on X
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=https://chikwama.net`,
                '_blank'
              )
            }
          >
            Share on Facebook
          </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );