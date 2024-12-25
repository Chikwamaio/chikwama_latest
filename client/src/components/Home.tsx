import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalculateIcon from '@mui/icons-material/Calculate';
import PieChartIcon from '@mui/icons-material/PieChart';
import Fade from '@mui/material/Fade';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Snackbar from '@mui/material/Snackbar';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';
import Footer from './Footer.tsx';
import NavBar from './NavBar.tsx';


const Home = () => {
    const [walletAddress, setWalletAddress] = useState<string>('')
    const [revenue, setRevenue] = useState("")
    const [tokenBalance, setTokenBalance] = useState("")
    const [tokenPrice, setTokenPrice] = useState<number>(0)
    const navigate = useNavigate();
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const abi = cashPoints.abi;
    const ethereum = (window as any).ethereum;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);
    const [state, setState] = useState({
      open: false,
      Transition: Fade,
    });

    const [errorMessage, setErrorMessage] = useState('');



  const handleGotodao = () => {
    navigate('/dao');
  };

  const handleClose = () => {
    setState({
      ...state,
      open: false,
    });
  };


//   const sendMoneyHandler = async (toAddress, amount, fee) => {
//     // Check if the address is valid
//     if (!ethers.utils.isAddress(toAddress)) {
//       setState({
//         open: true,
//         Transition: Fade,
//       });
//       setErrorMessage("Invalid address. Please check the recipient address.");
//       return;
//     }
  
//     const balance = await provider.getBalance(currentAccount!);
//     const address = toAddress;
//     const amountEther = ethers.utils.parseUnits(amount, "ether");
//     const feeEther = ethers.utils.parseUnits(fee, "ether");
//     const totalCost = amountEther.add(feeEther);
  
//     if (balance < totalCost) {
//       setState({
//         open: true,
//         Transition: Fade,
//       });
//       setErrorMessage(
//         `You have less than $${ethers.utils.formatEther(
//           totalCost
//         )} in your wallet ${currentAccount}`
//       );
//       return;
//     }
  
//     try {
//       const sendXdai = await cashPointsContract.send(amountEther, address, {
//         value: ethers.BigNumber.from(totalCost.toString()),
//       });
  
//       setState({
//         open: true,
//         Transition: Fade,
//       });
//       setErrorMessage(`Transaction successful: ${sendXdai.toString()}`);
//     } catch (error) {
//       setState({
//         open: true,
//         Transition: Fade,
//       });
//       setErrorMessage(`Transaction failed: ${error.message}`);
//     }
//   };

  
    const checkWalletIsConnected = async () => {
      const network =(await provider.getNetwork()).chainId;
      console.log(network);
    const accounts = await ethereum.request({ method: 'eth_requestAccounts'});
    setWalletAddress(accounts[0]);

    if(!ethereum)
    {
      setState({
        open: true,
        Transition: Fade,
      });

      setErrorMessage('Please install the metaamask wallet extension');
      return;
    }

    if(network != 33)
        {
          try {
            if(ethereum)({
              "method": "wallet_addEthereumChain",
              "params": [
                {
                  "chainId": "0x21",
                  "chainName": "Rootstock",
                  "rpcUrls": [
                    "http://127.0.0.1:4444"
                  ],
                  "iconUrls": [
                    "https://xdaichain.com/fake/example/url/xdai.svg",
                    "https://xdaichain.com/fake/example/url/xdai.png"
                  ],
                  "nativeCurrency": {
                    "name": "RBTC",
                    "symbol": "RBTC",
                    "decimals": 18
                  },
                  "blockExplorerUrls": [
                    "https://blockscout.com/poa/xdai/"
                  ]
                }
              ]
            });
        } catch (error: any) {
          setErrorMessage(error);
          return;
        }
          
        }

      const TokenBalance = await cashPointsContract.balanceOf(accounts[0]);

      setTokenBalance(TokenBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));

      const TokenPrice = await cashPointsContract.PRICE_PER_TOKEN();
      setTokenPrice(parseFloat(parseFloat(ethers.utils.formatEther(TokenPrice.toNumber())).toFixed(4)));


      provider.getBalance(contractAddress).then((balance) => {
        const balanceInDai = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
        const formattedBalance = balanceInDai.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        setRevenue(formattedBalance);
    });
    
   }

   const goToCashPoints = async () => {
        //navigate('/CashPoints', contractAddress, abi)
   }

  


  useEffect(() => {
    checkWalletIsConnected();

    
  }, [])

  return (
    
    <div className='container w-full h-screen text-slate-500'>
    <NavBar walletAddress={walletAddress.toString()}/>
      <main className='flex flex-grow w-full md:pt-24 pt-24 min-h-max'>
      <div className='basis-1/2 pr-4'>
      <h2 className='md:text-3xl text-3xl text-slate-700 lg:text-6xl uppercase'> Welcome to</h2>
      <h1 className='text-3xl md:text-3xl text-slate-700 lg:text-8xl font-bold uppercase mb-8'>Chikwama</h1>
      
      <p className='text-xl py-12'>Send, receive, buy and sell digital dollars, anywhere!</p>
      <button onClick={goToCashPoints} className="text-white bg-[#872A7F]  py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F]  hover:border hover:border-[#872A7F]  focus:outline-none focus:ring">
            Find a Cashpoint!
          </button>
      </div>
    <div className='basis-1/2 grid grid-cols-1 align-center bg-opacity-75  p-4'>
    <h4 className='text-xl text-slate-700 lg:text-2xl uppercase text-left'> DAO Metrics:</h4>
    <div className='bg-white mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative'>
        <CalculateIcon />
        <p className='text-xl text-yellow-400 text-left'>US$ {tokenPrice}</p> 
        <p className='text-left'>Current Price</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This is the current price of the CHK token in USD.
            </div>
        </div>
    </div>
    
    <div className='bg-white mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative'>
        <PieChartIcon />
        <p className='text-xl text-yellow-400 text-left'>{tokenBalance} CHK</p> 
        <p className='text-left'>Your Balance</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This shows your current CHK token balance.
            </div>
        </div>
    </div>
    
    <div className='bg-white mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative'>
        <AccountBalanceIcon />
        <p className='text-xl text-yellow-400 text-left'>US$ {revenue}</p> 
        <p className='text-left'>Contract Balance</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This indicates the total funds held in the DAO's smart contract, i.e., Chikwama DAO revenue to date.
            </div>
        </div>
    </div>
    <div className='align-center'>
    <button className='w-24 hover:text-fuchsia-700' onClick={handleGotodao}> Learn more...</button>
    </div>
    </div>
      <Snackbar 
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={state.open}
        onClose={handleClose}
        autoHideDuration={3000}
        TransitionComponent={state.Transition}
        message={errorMessage}
        key={state.Transition.name}>
        
        </Snackbar>
      </main>
      <Footer/>
    </div>
  )
}

export default Home;