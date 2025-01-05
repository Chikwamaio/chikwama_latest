import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { ethers } from 'ethers';
import * as React from 'react';
import { useEffect, useState } from 'react';
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';

type Props = {
    open: boolean;
    close: () => void;
    balance: any;
    withdraw: (tokens: any) => void;
  };

export default function Withdraw( {withdraw, open, close, balance}:Props ) {
  
  const [tokensToWithdraw, setTokens] = useState('');
  const [value, setValue] = React.useState('');
  const [loading, setLoading] = useState(false);
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const abi = cashPoints.abi;
  const ethereum = (window as any).ethereum;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);

  const handleWithdraw = () => {
    withdraw(tokensToWithdraw);
  };

  const handleClose = () => {
    close();
  };


  const getPriceHandler = async (tokens: any) => {
    setLoading(true);
    const tokenPrice = ethers.utils.formatEther(await cashPointsContract.PRICE_PER_TOKEN());
    let value = (tokens * parseFloat(tokenPrice)).toString();
    setValue(value);
    setLoading(false);

  }


  useEffect(() => {
    
  }, [])

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Withdraw Tokens</DialogTitle>
        <DialogContent>
          <DialogContentText>
          You own {balance?.toString()} CHK. To withdraw your stake in Chikwama please enter the number of tokens you would like to liquidate.
          </DialogContentText>
          {loading&&<CircularProgress sx={{
              position: 'absolute',
              top: 160,
              left: 120,
              zIndex: 1,
            }} size={68} color="secondary" />}
          <TextField
          required
            autoFocus
            margin="dense"
            value = {tokensToWithdraw}
            id="name"
            label="Number of tokens"
            type="number"
            fullWidth
            variant="filled"
            onChange={async(e) => {
              const tokens = e.target.value
                setTokens(tokens);
                await getPriceHandler(tokens);
              }}
          />
          <DialogContentText>
            Value: $ {value}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button disabled={balance<=0 || parseFloat(tokensToWithdraw)<=0 || parseFloat(tokensToWithdraw) > balance} onClick={handleWithdraw}>WITHDRAW</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
