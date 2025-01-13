import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';
import BuyTokens from './BuyTokens.tsx';
import Footer from './Footer';
import NavBar from './NavBar';
import Withdraw from './Withdraw';
import { getSmartWalletAddress, RelayClient, setEnvelopingConfig, setProvider, UserDefinedDeployRequest } from '@rsksmart/rif-relay-client';
import { ERC20__factory } from '@rsksmart/rif-relay-contracts';


const Dao = () => {

    const [loading, setLoading] = useState(false);
    const ethereum = (window as any).ethereum;
    const abi = cashPoints.abi;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const tokenContract = import.meta.env.VITE_TOKEN_CONTRACT;
    const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);
    const [contractBalance, setContractBalance] = useState<any>();
    const [smartWalletBalance, setSmartWalletBalance] = useState('');
    const [smartWalletAddress, setSmartWalletAddress] = useState<string>('');
    const [chkTokenBalance, setCHKTokenBalance] = useState<any>();
    const FORTY_SECONDS = 40 * 1000;
    const [openBuyModal, setOpenBuyModal] = useState(false);
    const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
    const [account, setAccount] = useState<string>('');
    const [availableTokens, setAvailableTokens] = useState('');
    const [state, setState] = useState({
        open: false,
        Transition: Fade,
      });
   const [errorMessage, setErrorMessage] = useState('');

   const handleClose = () => {
    setState({
      ...state,
      open: false,
    });
  };

  const  handleOpenBuy = async() => { 
    setLoading(true);
    const tokens = (await cashPointsContract.AVAILABLE_TOKENS()).toString();
    setAvailableTokens(tokens);
    setLoading(false);
    setOpenBuyModal(true); 
  
  };

  const  handleOpenWithdraw = async() => { 
    setOpenWithdrawModal(true); 
  
  };

  const handleCloseBuyModal = () => { setOpenBuyModal(false); };
  const handleCloseWithdrawModal = () => { setOpenWithdrawModal(false); };
  const buyTokensHandler = async (tokens: any) => {
        const balance = contractBalance;
        //const network = (await provider.getNetwork()).chainId;
  
        //   if(network != 100)
        //   {
        //     setState({
        //       open: true,
        //       Transition: Fade,
        //     });
        //     setErrorMessage('You are connected to the wrong blockchain, please connect to the Gnosis chain');
        //     return;
        //   }
  
          if(balance.isZero()){
  
            setState({
              open: true,
              Transition: Fade,
            });
  
            setErrorMessage('We are unable to fulfill your buy request at this time, because there is no value in the contract');
            return;
          }
  
          
  
          if(tokens % 1 != 0 )
          {
            setState({
              open: true,
              Transition: Fade,
            });
  
            setErrorMessage('Tokens are non divisible please enter an integer value');
            return;
          }

          if(tokens == 0 )
          {
            setState({
              open: true,
              Transition: Fade,
            });
  
            setErrorMessage(`You cannot buy ${tokens} CHK`);
            return;
          }

          const newPrice = await cashPointsContract.PRICE_PER_TOKEN();
          let cost = parseFloat(ethers.utils.formatEther(newPrice)) * tokens;
          await cashPointsContract.buyTokens(tokens, { value: ethers.utils.parseUnits(cost.toString(), "ether")});
        
          
    }

    const withdrawHandler = async (tokens: any) => {

      if(tokens % 1 != 0 )
          {
            setState({
              open: true,
              Transition: Fade,
            });
  
            setErrorMessage('Tokens are non divisible please enter an integer value');
            return;
          }


      await cashPointsContract.withdraw(tokens);
    };

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
                    tokenContract: tokenContract,
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
          
            };
    
      
          const initialize = async () => {
            const account = await getProviderWallet();
            setAccount(account); 

            const balance = await cashPointsContract.balanceOf(account);
            setCHKTokenBalance(balance);

            if (account) {
              await fetchSmartWalletAddress(account);
            } else {
              console.error('Failed to get account');
            }
          };
      
          initialize();
        }
        
      }, [smartWalletAddress]);

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
                  
                  const tokenbalance = await tokenContract.instance.balanceOf(smartWalletAddress);
                  const balance = await tokenContract.instance.balanceOf(contractAddress);

                    const tokenBalanceInDollars = parseFloat(ethers.utils.formatEther(tokenbalance)).toFixed(2);
                    const formattedTokenBalance = tokenBalanceInDollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setSmartWalletBalance(formattedTokenBalance);

                    const balanceInDollars = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
                    const formattedBalance = balanceInDollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setContractBalance(formattedBalance);
       
                } catch (error) {
                  console.error("Error fetching ERC-20 token:", error);
                }
              };
            
              fetchERC20Data(); // Call the fetch function
            }, [provider]);

    return(
        <div className="h-screen flex-col text-slate-500">
        <NavBar walletAddress={smartWalletAddress} eoa={account} tokenBalance={smartWalletBalance} />
        <main className="text-black container mx-auto px-6 md:pt-24 pt-24 flex-1 text-left mb-8 pb-16">
          <h1 className="text-3xl md:text-3xl text-slate-700 lg:text-8xl font-bold uppercase mb-8">Chikwama DAO</h1>
          <p>
            A DAO or decentralised autonomous organisation is a member-owned community without centralized leadership.
            Created because said members share a common goal. The rules that govern a DAO are encoded as a{' '}
            <Link className="text-[#872A7F]" href="https://github.com/Chikwama-io/ChikwamaWebsite/blob/master/contracts/contracts/Cashpoints.sol">
              computer program.
            </Link>
          </p>
          <br />
          <p>
            The Chikwama DAO was created to catalyse the creation of a global network of blockchain-based digital dollar cashpoints.
            The original members believe that would-be cash point operators can be incentivised to operate cash points by allowing
            them to{' '}
            <Link className="text-[#872A7F]" onClick={handleOpenBuy}>
              own a stake in the DAO
            </Link>{' '}
            and{' '}
            <Link className="text-[#872A7F]" onClick={handleOpenWithdraw}>
              liquidate
            </Link>{' '}
            their stake in a permissionless manner.
          </p>
          {loading && (
            <CircularProgress
              sx={{
                position: 'absolute',
                top: 250,
                left: 120,
                zIndex: 1,
              }}
              size={68}
              color="secondary"
            />
          )}
          <BuyTokens open={openBuyModal} buyTokens={buyTokensHandler} close={handleCloseBuyModal} available={availableTokens} />
          <Withdraw open={openWithdrawModal} withdraw={withdrawHandler} close={handleCloseWithdrawModal} balance={chkTokenBalance} />
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
          key={state.Transition.name}
        />
        <Footer />
      </div>
        );
}

export default Dao;