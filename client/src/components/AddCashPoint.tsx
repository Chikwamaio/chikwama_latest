import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';
import currencies from '../resources/currencies.json';

type Prop = {
  open: boolean;
  close: () => void;
  update: boolean;
  add: (cashPointName: any,phoneNumber: any,currency: any, buyRate: any, sellRate: any, duration: any, feeAmount: any, latitude: any, longitude: any) => void;
};

export default function AddCashPoint({open, close, update, add}: Prop) {

  const[latitude, setLatitude]= useState('');
  const [longitude, setLongitude]= useState('');
  const [accuracy, setAccuracy]= useState('');
  const [feeAmount, setFee] = useState('');
  const [currency, setCurrency] = useState('');
  const [duration, setDuration] = useState(0);
  const [cashPointName, setCashPointName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [sellRate, setSellRate] = useState('');
  const [loading, setLoading] = useState(false);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const abi = cashPoints.abi;

  const ethereum = (window as any).ethereum;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);

  const handleClose = () => {
    close();
  };

  const handleAdd = () => {
    handleClose();
    add(cashPointName,phoneNumber,currency, buyRate, sellRate, duration, feeAmount, latitude, longitude);

  }


  const getCostHandler = async (Duration: number) => {
    setLoading(true);
    const fee = await cashPointsContract.CASHPOINT_FEE();
    let cost = ((parseInt(fee.toString())) * Duration).toString();
   
    setFee(ethers.utils.formatEther(cost));
    setLoading(false);

  }


  const marks = [
    {
      value: 0,
      label: '0',
    },
    {
      value: 365,
      label: '365',
    },
  ];


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        setAccuracy(position.coords.accuracy.toString())
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
      })
    };
  }, [])

  return (
    <Dialog onClose={close} open={open}>
      <DialogTitle>{update?'Update a Cashpoint':'Add a Cashpoint'}</DialogTitle>
        <DialogContent>
        <DialogContentText>
        {update?`You are about to update your cash point details(The cash points location will be your current location accurate to ${accuracy} metres).`:`You are about to create a cash point at this location accurate to ${accuracy} metres.`}</DialogContentText>
        <TextField
            autoFocus
            margin="dense"
            value={cashPointName}
            id="name"
            label="Cash point name"
            type="text"
            fullWidth
            variant="filled"
            onChange={(e) => {
              setCashPointName(e.target.value);
            }}
          />
          <TextField
            autoFocus
            margin="dense"
            value={phoneNumber}
            id="phone"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="filled"
            onChange={async(e) => {  
              setPhoneNumber(e.target.value);
            }}
          />
          {loading&&<CircularProgress sx={{
              position: 'absolute',
              top: 220,
              left: 120,
              zIndex: 1,
            }} size={68} color="secondary" />}
          <InputLabel id="demo-simple-select-standard-label">Currency:</InputLabel>
           <Select
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          variant="filled"
          value={currency}
          label="Currency"
          onChange={async(e) => {
            setCurrency(e.target.value);
          }}
        >
            {currencies.map(({cc,symbol, name}, index) => (
            <MenuItem key={index} value={`${symbol} - ${name}`}>
              {cc} - {name}
            </MenuItem>
          ))}
    </Select>
          <TextField
            autoFocus
            margin="dense"
            value={buyRate}
            id="buyRate"
            label="Buy rate"
            type="number"
            fullWidth
            variant="filled"
            onChange={async(e) => {
              setBuyRate(e.target.value);
            }}
          />
          <TextField
            autoFocus
            margin="dense"
            value={sellRate}
            id="sellRate"
            label="Sell rate"
            type="number"
            fullWidth
            variant="filled"
            onChange={async(e) => {
              setSellRate(e.target.value);
            }}
          />
          <InputLabel>Duration(Days):</InputLabel>
         <Slider
         className='color-[#872A7F]' 
         sx={{ width: 260 }} 
         defaultValue={30} 
         step={1} 
         marks={marks} 
         min={0} 
         max={365} 
         valueLabelDisplay="auto"
         value={duration} onChange={async(e) => {
          const Duration = (e.target as HTMLInputElement).value || '';
          setDuration(Number(Duration));
          await getCostHandler(Number(Duration));
        }}
         />
          <DialogContentText>
           Fee: ${feeAmount}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button className='text-[#872A7F]' onClick={handleClose}>Cancel</Button>
          <Button className='text-[#872A7F]' disabled={ !sellRate || !buyRate && !currency || !phoneNumber || !cashPointName } onClick={handleAdd}>{update?'Update':'Add'}</Button>
        </DialogActions>
    </Dialog>
  );
}