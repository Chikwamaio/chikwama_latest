import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';
import {  RelayClient, UserDefinedEnvelopingRequest } from '@rsksmart/rif-relay-client';
import { ERC20__factory } from '@rsksmart/rif-relay-contracts';

type Prop = {
    open: boolean;
    close: () => void;
    send: (amount: any, feeAmount: any, gasFee: any) => void;
    cashPoint: any;
    swAddress: any;
    account: any
  };

export default function SendMoney({open, close, send, cashPoint, swAddress, account}: Prop) {

  const [amount, setAmount] = useState<any>(0);
  const [feeAmount, setFee] = useState('');
  const [gasFee, setGasFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<any>();
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const abi = cashPoints.abi;

  const ethereum = (window as any).ethereum;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);
  const handleClose = () => {
    close();
  };

  const handleSend = () => {
    send(amount, feeAmount, gasFee);
  }

  const getCostHandler = async () => {
    setLoading(true);
    const fee = await cashPointsContract.TRANSACTION_COMMISION();
   
    const amountInWei = ethers.utils.parseEther(amount.toString());
    const cost = amountInWei.mul(fee).div(100);


    try {
        const encodedAbi = token!.instance.interface.encodeFunctionData(
          'transfer',
          [cashPoint?.address, amount]
        );

        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: encodedAbi,
            to: token!.instance.address,
            tokenContract: token!.instance.address,
          },
          relayData: {
            callForwarder: swAddress,
          },
        };
        const relayClient = new RelayClient();
        const bitcoinPrice = BigInt(100000);
        const estimation = await relayClient!.estimateRelayTransaction(relayTransactionOpts);
        const nativeFee = parseFloat(ethers.utils.formatEther(BigInt(estimation.requiredNativeAmount) * bitcoinPrice)).toFixed(4)
        setGasFee(nativeFee);
      } catch (error) {
        const errorObj = error as Error;
        if (errorObj.message) {
          alert(errorObj.message);
        }
        console.error(error);
      }
      
    
    setFee(ethers.utils.formatEther(cost));
    setLoading(false);

  }

useEffect(() => {
        const getERC20Token = async () => {
          const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT;
          const instance = ERC20__factory.connect(tokenAddress, provider);
      
          const [symbol, name, decimals] = await Promise.all([
            instance.symbol(),
            instance.name(),
            instance.decimals(),
          ]);
      
          return {
            instance,
            symbol,
            name,
            decimals,
          };
        };
      
        const fetchERC20Data = async () => {
          try {
            const tokenContract = await getERC20Token(); // Await the result
            setToken(tokenContract)

            
          } catch (error) {
            console.error("Error fetching ERC-20 token:", error);
          }
        };
      
        fetchERC20Data(); // Call the fetch function
      },[swAddress, provider]);

  return (
    <Dialog onClose={close} open={open}>
      <DialogTitle>Withdraw</DialogTitle>
        <DialogContent>
            {cashPoint && (
        <DialogContentText>
            You are about to withdraw from <b>{cashPoint?.name} cashpoint in {cashPoint?.city}</b> at the rate 1 DOC to {(cashPoint?.currency).split('-')[0].trim()} {cashPoint?.buyRate}.
            Enter the amount you would like to withdraw below:
          </DialogContentText>
            )}
          {loading&&<CircularProgress sx={{
              position: 'absolute',
              top: 160,
              left: 120,
              zIndex: 1,
            }} size={68} color="secondary" />}
          <TextField
            autoFocus
            margin="dense"
            value={amount}
            id="name"
            label="Amount"
            type="number"
            fullWidth
            variant="filled"
            onChange={async(e) => {
              const amount = e.target.value;
              setAmount(amount);
              
            }}
            
          />
       <div className="bg-slate-500 p-4 w-max text-sm">
  <div className="flex justify-between text-white">
    <span className="text-left">Convenience fee: </span>
    <span className="text-right" style={{ fontFamily: 'Digital-7, monospace' }}>${feeAmount}</span>
  </div>
  <div className="flex justify-between text-white">
    <span className="text-left">You will receive: </span>
    {cashPoint && 
    <span className="text-right" style={{ fontFamily: 'Digital-7, monospace' }}>
      {(cashPoint?.currency).split('-')[0].trim()}
      {new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount * cashPoint?.buyRate)}
    </span>
}
  </div>
  {gasFee && (
    <div className="flex justify-between text-white">
      <span className="text-left">Estimated network fee: </span>
      <span className="text-right" style={{ fontFamily: 'Digital-7, monospace' }}>${gasFee}</span>
    </div>
  )}
</div>
<DialogContentText
      sx={{ marginTop: 2, fontSize: '0.85rem', color: 'gray', textAlign: 'center' }}
    >
      <em>
        Please note: You must physically meet the cashpoint operator at the specified location to complete this withdrawal. Please confirm {cashPoint?.address} is their Chikwama address
      </em>
    </DialogContentText>
        </DialogContent>
        
        <DialogActions>
            <Button onClick={getCostHandler}>Estimate Fees</Button>
          <Button onClick={handleClose}>Cancel</Button>
          <Button disabled={!amount || !gasFee} onClick={handleSend}>Withdraw</Button>
        </DialogActions>
    </Dialog>
  );
}