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
import { setProvider, getSmartWalletAddress, UserDefinedDeployRequest, RelayClient, setEnvelopingConfig} from '@rsksmart/rif-relay-client';
import {
  ERC20__factory,
} from '@rsksmart/rif-relay-contracts';

const Home = () => {
    const [revenue, setRevenue] = useState("")
    const [tokenBalance, setTokenBalance] = useState("");
    const [smartWalletBalance, setSmartWalletBalance] = useState("")
    const [tokenPrice, setTokenPrice] = useState<number>(0)
    const navigate = useNavigate();
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(true);
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const abi = cashPoints.abi;
    const ethereum = (window as any).ethereum;
    const provider = ethereum ? new ethers.providers.Web3Provider(ethereum) : null;
    const signer = provider?.getSigner();
    const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);
    const [state, setState] = useState({
      open: false,
      Transition: Fade,
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [account, setAccount] = useState<string>('');


  const handleGotodao = () => {
    navigate('/dao');
  };

  const handleClose = () => {
    setState({
      ...state,
      open: false,
    });
  };


  
    const checkWalletIsConnected = async () => {
      if(!provider){
        
        setIsMetaMaskInstalled(false);
        return;
      }

      const network =(await provider.getNetwork()).chainId;
      const account = await getProviderWallet();
      if (account) {
        setAccount(account);
      }

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
                  ],
                  "nativeCurrency": {
                    "name": "TRBTC",
                    "symbol": "TRBTC",
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

      const TokenBalance  = await  cashPointsContract.balanceOf(smartWalletAddress);

      setTokenBalance(TokenBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));

      const TokenPrice = await cashPointsContract.PRICE_PER_TOKEN();
      setTokenPrice(parseFloat(parseFloat(ethers.utils.formatEther(TokenPrice.toNumber())).toFixed(4)));
    
   }

   const goToCashPoints = async () => {
        navigate('/CashPoints', contractAddress)
   }

   const [smartWalletAddress, setSmartWalletAddress] = useState<string>('');
  const FORTY_SECONDS = 40 * 1000;
  


  const deploySmartWallet = async (index: string) => {

  const checkSmartWalletDeployment = async (txHash: string) => {
    if (!provider) {
      return false;
    }
    const receipt = await provider.waitForTransaction(txHash, 1, FORTY_SECONDS);
    if (receipt === null) {
      return false;
    }

    console.log(`Your receipt is ${receipt}`);

    return receipt.status === 1;
  };

  const relayClient= new RelayClient()
  const relaySmartWalletDeployment = async (
    tokenAmount: string
  ) => {

  
    try {
      const relayTransactionOpts: UserDefinedDeployRequest = {
        request: {
          from: account!,
          tokenAmount,
          tokenContract: import.meta.env.VITE_CONTRACTS_TOKEN,
          index: Number(index),
        },
      };
      const transaction = await relayClient!.relayTransaction(
        relayTransactionOpts
      );

      const isDeployed = await checkSmartWalletDeployment(transaction.hash!);
      if (!isDeployed) {
        throw new Error('SmartWallet: deployment failed');
      }
      
      

      return {
        isDeployed,
      };
    } catch (error) {
      const errorObj = error as Error;
      if (errorObj.message) {
        alert(errorObj.message);
      }
      console.error(error);
    }

    
  };

  const deployedSmartWallet = await relaySmartWalletDeployment('0');
  console.log(`Smart wallet deployed: ${JSON.stringify(deployedSmartWallet)}`);

  }
  
  const getProviderWallet = async () => {
    const account = await provider?.getSigner().getAddress();
    console.log(`Your wallet address is ${account}`);
    return account;
  };

  useEffect(() => {
    const index = "0";
    if (provider) {
      setEnvelopingConfig({
        logLevel: 1,
        chainId: parseInt(import.meta.env.VITE_RIF_RELAY_CHAIN_ID),
        preferredRelays: import.meta.env.VITE_RIF_RELAY_PREFERRED_RELAYS.split(','),
        relayHubAddress: import.meta.env.VITE_CONTRACTS_RELAY_HUB,
        deployVerifierAddress: import.meta.env.VITE_CONTRACTS_DEPLOY_VERIFIER,
        relayVerifierAddress: import.meta.env.VITE_CONTRACTS_RELAY_VERIFIER,
        smartWalletFactoryAddress: import.meta.env.VITE_CONTRACTS_SMART_WALLET_FACTORY,
        forwarderAddress: import.meta.env.VITE_CONTRACTS_SMART_WALLET,
        gasPriceFactorPercent: parseInt(import.meta.env.VITE_RIF_RELAY_GAS_PRICE_FACTOR_PERCENT),
        relayLookupWindowBlocks: parseInt(import.meta.env.VITE_RIF_RELAY_LOOKUP_WINDOW_BLOCKS),
      });
      setProvider(provider);

      const fetchSmartWalletAddress = async (account: string) => {
        const smartWalletAddress = await getSmartWalletAddress(account, index);
        console.log(`Your smart wallet address is ${smartWalletAddress}`);

        const code = await provider.getCode(smartWalletAddress);
        if (code !== '0x00' && code !== '0x') {
          console.log('Smart wallet already deployed');
          setSmartWalletAddress(smartWalletAddress);
          return;
        }

        deploySmartWallet(index);
      };

      const initialize = async () => {
        const account = await getProviderWallet();
        if (account) {
          await fetchSmartWalletAddress(account);
        } else {
          console.error('Failed to get account');
        }
      };

      initialize();
    }
  }, [provider]);

  

  useEffect(() => {
    console.log(ethereum, provider)
  }, []);

  useEffect(() => {


    checkWalletIsConnected();
    const getERC20Token = async () => {
      const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT;
      
      if (!provider) {
        throw new Error("Provider is not available");
      }
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
        const tokenContract = await getERC20Token(); 
        const balance = await tokenContract.instance.balanceOf(contractAddress);

        const tokenbalance = await tokenContract.instance.balanceOf(smartWalletAddress);

          const balanceInDollars = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
          const formattedBalance = balanceInDollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          setRevenue(formattedBalance);

          const tokenBalanceInDollars = parseFloat(ethers.utils.formatEther(tokenbalance)).toFixed(2);
          const formattedTokenBalance = tokenBalanceInDollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          setSmartWalletBalance(formattedTokenBalance);
    
        
      } catch (error) {
        console.error("Error fetching ERC-20 token:", error);
      }
    };
  
    fetchERC20Data(); 
  }, [provider]);

  const renderMetaMaskPrompt = () => (
    <div className="flex flex-col items-center justify-center h-screen text-center text-slate-500">
        <h2 className="text-2xl md:text-3xl font-bold text-red-600">Oops! No MetaMask detected!</h2>
        <p className="mt-4 text-lg">
            This is a blockchain app. To experience the *Internet of Value*, you'll need MetaMask installed.  
            <br />
            Don't worry, it's not as scary as it sounds!
        </p>
        <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 px-4 py-2 bg-[#872A7F] text-white rounded hover:bg-transparent hover:text-[#872A7F] border border-[#872A7F]"
        >
            Install MetaMask
        </a>
    </div>
);
return isMetaMaskInstalled ? (
    
    <div className='w-full h-screen text-slate-500'>
    <NavBar walletAddress={smartWalletAddress} eoa={account} tokenBalance={smartWalletBalance}/>
      <main className='flex flex-grow w-full md:pt-24 pt-24 min-h-max'>
      <div className='basis-1/2 p-4'>
      <h2 className='md:text-3xl text-3xl text-slate-700 lg:text-6xl uppercase'> Welcome to</h2>
      <h1 className='text-3xl md:text-3xl text-slate-700 lg:text-8xl font-bold uppercase mb-8'>Chikwama</h1>
      
      <p className='text-xl py-12'>Send, receive, buy and sell digital dollars, anywhere!</p>
      <button onClick={goToCashPoints} className="text-white bg-[#872A7F]  py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F]  hover:border hover:border-[#872A7F]  focus:outline-none focus:ring">
            Find a Cashpoint!
          </button>
      </div>
    <div className='basis-1/2 grid grid-cols-1 align-center bg-opacity-75  p-4'>
    <h4 className='text-xl text-slate-700 lg:text-2xl uppercase text-left'> DAO Metrics:</h4>
    <div className='bg-white rounded-md mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative  z-30'>
        <CalculateIcon />
        <p className='text-xl text-yellow-400 text-left' style={{ fontFamily: 'Digital-7, monospace' }}>US$ {tokenPrice}</p> 
        <p className='text-left'>Current Price</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This is the current price of the Chikwama token in USD.
            </div>
        </div>
    </div>
    
    <div className='bg-white rounded-md mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative z-10'>
        <PieChartIcon />
        <p className='text-xl text-yellow-400 text-left' style={{ fontFamily: 'Digital-7, monospace' }}>{tokenBalance} CHK</p> 
        <p className='text-left'>Your Balance</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This shows your current Chikwama token balance.
            </div>
        </div>
    </div>
    
    <div className='bg-white rounded-md mx-auto mb-4 float-right p-2 border-2 border-gray-300 h-24 w-40 metric-container relative'>
        <AccountBalanceIcon />
        <p className='text-xl text-yellow-400 text-left' style={{ fontFamily: 'Digital-7, monospace' }}>US$ {revenue}</p> 
        <p className='text-left'>Contract Balance</p>
        <div className='absolute top-1 right-1 group'>
            <span className='text-gray-400 cursor-pointer'><HelpOutlineIcon/></span>
            <div className='hidden group-hover:block absolute right-1 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-40 tooltip-container'>
                This indicates the total funds held in the DAO's smart contract, i.e., Chikwama DAO revenue to date less any stake liquidations.
            </div>
        </div>
    </div>
    <div className='align-center'>
    <button className='w-24 hover:text-fuchsia-700' onClick={handleGotodao}> Learn more...</button>
    </div>
    </div>

      </main>
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
      <Footer/>
    </div>
    
  ): (
    renderMetaMaskPrompt()
);
}

export default Home;