import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import { Button, Card, CardActions, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fade, Link, TextField, Typography } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { ethers, Transaction, utils } from 'ethers';
import { Feature, Map, View } from 'ol';
import { defaults as defaultControls } from 'ol/control';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import { useEffect, useRef, useState } from 'react';
import cashPoints from '../../../contracts/artifacts/contracts/Cashpoints.sol/CashPoints.json';
import NavBar from './NavBar';
import AddCashPoint from './AddCashPoint';
import { setProvider, getSmartWalletAddress, UserDefinedDeployRequest, RelayClient, setEnvelopingConfig, UserDefinedEnvelopingRequest} from '@rsksmart/rif-relay-client';
import {
  ERC20__factory,
} from '@rsksmart/rif-relay-contracts';
//import SendMoney from './SendMoney';
//import { SocialMediaModal } from './SocialMediaModal';

const CashPoints = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [isCashPoint, setIsCashPoint] = useState(false);
    const [data, getData] = useState<any[]>([]);
    const [isActive, setIsActive] = useState<boolean[]>([]);
    const [walletAddress, setWalletAddress] = useState('');
    const [smartWalletBalance, setSmartWalletBalance] = useState('');
    const [state, setState] = useState({ open: false, Transition: Fade });
    const [errorMessage, setErrorMessage] = useState('');
    
    // State for the email modal
    const [openEmailModal, setOpenEmailModal] = useState(false);
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');

    const abi = cashPoints.abi;
    const ethereum = (window as any).ethereum;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const emailScriptURL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_WEB_APP_URL;
    const cashPointsContract = new ethers.Contract(contractAddress, abi, signer);
    const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
    const [openSend, setOpenSend] = useState(false);
    interface CashPoint {
        address: string;
        name: string;
        city: string;
        phoneNumber: string;
        currency: string;
        buyRate: number;
        sellRate: number;
        until: string;
    }
    const [smartWalletAddress, setSmartWalletAddress] = useState<string>('');
    const FORTY_SECONDS = 40 * 1000;
    const [currentCashPoint, setCurrentCashPoint] = useState<CashPoint | null>(null);
    const [account, setAccount] = useState<string>('');
    const [openSocialModal, setOpenSocialModal] = useState(false);
    const [shareMessage, setShareMessage] = useState(''); 

    const mapRef = useRef<HTMLDivElement | null>(null);
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
      
        };

    const closeSend = () => {
      setOpenSend(false);
    };
    const sendMoneyHandler = async (amount: string, fee: string, gasFee: string) => {
    
      const balance = await provider.getBalance(walletAddress);
      const address = currentCashPoint?.address;
      const amountEther = ethers.utils.parseUnits(amount, "ether");
      const feeEther = ethers.utils.parseUnits(fee, "ether");
      const gasFeeEther = ethers.utils.parseUnits(gasFee, "ether");
      const totalCost = amountEther.add(feeEther).add(gasFeeEther);


      const message = `I just converted my crypto dollars to money I can use here in Blantyre, Malawi, thanks to Chikwama! Check it out at https://chikwama.net or follow @chikwamaio.`;
      setShareMessage(message);
      setOpenSocialModal(true);

      if (balance.lt(totalCost)) {
        setState({
          open: true,
          Transition: Fade,
        });
        setErrorMessage(
          `You have less than $${ethers.utils.formatEther(
            totalCost
          )} in your wallet ${walletAddress}`
        );
        return;
      }
    
      try {
        const sendXdai = await cashPointsContract.send(amountEther, address, {
          value: ethers.BigNumber.from(totalCost.toString()),
        });
    
        setState({
          open: true,
          Transition: Fade,
        });
        setErrorMessage(`Transaction successful: ${sendXdai.toString()}`);
      } catch (error) {
        setState({
          open: true,
          Transition: Fade,
        });
        if (error instanceof Error) {
          setErrorMessage(`Transaction failed: ${error.message}`);
        } else {
          setErrorMessage('Transaction failed: An unknown error occurred');
        }
      }
    };

    useEffect(() => {
        const vectorSource = new VectorSource();
        const cps = [
          { city: 'Blantyre, Malawi', coordinates: [34.995, -15.786], cashPointName: 'Alpha', address: '0x54910e51713295dE5428470837930a6E35A41967', phoneNumber:'+265 999 999 999', currency:'MWK', buyRate: 1700, sellRate:2000, until: '2025-01-01'},
          { city: 'Lilongwe, Malawi', coordinates: [33.7741, -13.9626], cashPointName: 'Beta', address: '0x54910e51713295dE5428470837930a6E35A41967', phoneNumber:'+265 999 999 888', currency:'MWK', buyRate: 1800, sellRate:2000, until: '2025-01-01'},
          // Add other cities...
        ];
    
        cps.forEach((cp) => {
          const CashPoint = new Feature({
            geometry: new Point(fromLonLat(cp.coordinates)),
            name: cp.cashPointName,
            address: cp.address,
            phoneNumber: cp.phoneNumber,
            currency: cp.currency,
            buyRate: cp.buyRate,
            sellRate: cp.sellRate,
            until: cp.until,
            city: cp.city,
          });
          CashPoint.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: '/icons8-marker-94.png',
                scale: 0.25,
              }),
            })
          );
          vectorSource.addFeature(CashPoint);
        });
    
        const vectorLayer = new VectorLayer({
          source: vectorSource,
        });
    
        const map = new Map({
          target: mapRef.current || undefined,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            vectorLayer,
          ],
          view: new View({
            center: fromLonLat([35, -15]),
            zoom: 5,
          }),
          controls: defaultControls(),
        });
    
        // Display popover on feature click
        map.on('click', (evt) => {
          const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f) as Feature<Point> | null;

          if (feature) {
            setCurrentCashPoint({
                address: feature.get('address'),
                name: feature.get('name'),
                city: feature.get('city'),
                phoneNumber: feature.get('phoneNumber'),
                currency: feature.get('currency'),
                buyRate: feature.get('buyRate'),
                sellRate: feature.get('sellRate'),
                until: feature.get('until'),
            });
            setCardPosition({
              top: evt.pixel[1],
              left: evt.pixel[0],
            });
          } else {
            setCurrentCashPoint(null);
          }
        });
    
        // Cleanup on component unmount
        return () => {
          map.setTarget('');
        };
    
    }, []);

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

      getCashPoints();
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
  
              const tokenBalanceInDollars = parseFloat(ethers.utils.formatEther(tokenbalance)).toFixed(2);
              const formattedTokenBalance = tokenBalanceInDollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              setSmartWalletBalance(formattedTokenBalance);
       
          } catch (error) {
            console.error("Error fetching ERC-20 token:", error);
          }
        };
      
        fetchERC20Data(); // Call the fetch function
      }, [provider]);

    const handleClose = () => {
        setState({ ...state, open: false });
    };

    const handleOpenCreate = async () => {
        const cp = await cashPointsContract.getCashPoint(smartWalletAddress);
        setIsCashPoint(cp._isCashPoint);
        setOpenCreate(true);
    };

    const closeCreate = () => {
        setOpenCreate(false);
    };

    const makeApproveCall = async (destinationContract: string, spender: string, fee: string) => {
        const cost = ethers.utils.parseUnits(fee, "ether");
        const ApproveData = calculateAbiEncodedFunction(`approve(address spender, uint fee)`, [spender, cost])
        const swAddress = smartWalletAddress;
        const tokenAmount = 0;

        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: ApproveData,
            to: destinationContract,
            tokenAmount,
            tokenContract: destinationContract,
          },
          relayData: {
            callForwarder: swAddress,
          },
        };
        const relayClient= new RelayClient()
        console.log(relayClient)
        const transaction: Transaction = await relayClient.relayTransaction(relayTransactionOpts);
        setState({
          open: true,
          Transition: Fade,
        });

        setErrorMessage('You have successfully approved the transaction ' + transaction.hash);
    }


    const calculateAbiEncodedFunction = (functionName: string, params: any[]) => {
      console.log('getting functiondata')
      
      const funct = functionName.trim()
        const iface = new utils.Interface([`function ${funct}`]);
        return iface.encodeFunctionData(functionName!, params);
      };

      // async function estimateDirectExecution(
      //   swAddress: string,
      //   toAddress: string,
      //   abiEncodedTx: string
      // ): Promise<BigNumber> {
      //   const iForwarder = IForwarder__factory.connect(swAddress, provider!);
    
      //   const estimate = await iForwarder.estimateGas.directExecute(
      //     toAddress,
      //     abiEncodedTx
      //   );
      //   console.log(estimate)
      //   return estimate;
      // };

    async function createCashPointHandler(cashPointName: any, phoneNumber: any, currency: any, buyRate: any, sellRate: any, duration: number, fee: string, lat: any, long: any): Promise<void> {
      const now = new Date();
      const endtime =  new Date(now.setDate(now.getDate() + duration));
    
      let city;


      var requestOptions = {
        method: 'GET',
      };
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`, requestOptions);
      const jsonResponse = await res.json();
      city = jsonResponse.results[0].address_components[2].long_name + ', ' + jsonResponse.results[0].address_components[4].long_name;
      //const cost = ethers.utils.parseUnits(fee, "ether");
      console.log("already registered:", isCashPoint);
      // if(isCashPoint){  

      //   const CashPoint = await cashPointsContract.getCashPoint(smartWalletAddress);
      //   const currentEndtime = new Date(Date.parse(CashPoint._endTime));
      //   const now = new Date()
      //   const IsActive = currentEndtime > now;
      //   const newEndtime = IsActive ? new Date(currentEndtime.setDate(currentEndtime.getDate() + duration)) : new Date(now.setDate(now.getDate() + duration));
      //   if(city){
      //   const updateCashPoint = await cashPointsContract.updateCashPoint(cashPointName, city, phoneNumber, currency, buyRate, sellRate, newEndtime.toString(), duration, { value: cost});

      //   return;  
      // }

      // console.log('failed to access your location');
      //   return;
      // }
      
      //const basefee = await cashpoints.BASE_FEE();
      const destinationContract = import.meta.env.VITE_CONTRACT_ADDRESS;
      const tokenContract = import.meta.env.VITE_TOKEN_CONTRACT;

      console.log('Approve params:',tokenContract, destinationContract, fee)
      await makeApproveCall( tokenContract, destinationContract, fee)

      const params = [cashPointName, city, phoneNumber, currency, buyRate, sellRate, endtime.toString(), duration]
   

    const funcData = calculateAbiEncodedFunction('addCashPoint(string name, string  city, string  phone, string currency, uint buy, uint sell, string endtime, uint duration)', params)
    //addCashPoint(name, city, phone, currency, buy, sell, endtime.toString(), duration)
    
    const swAddress = smartWalletAddress;
      //const addCashPoint = await cashPointsContract.addCashPoint(cashPointName, city, phoneNumber, currency, buyRate, sellRate, endtime.toString(), duration, { value: cost});
    // await estimateDirectExecution(
    //     swAddress,
    //     destinationContract,
    //     funcData
    //   );

    const tokenAmount = 0;
        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: funcData,
            to: destinationContract,
            tokenAmount,
            tokenContract: tokenContract,
          },
          relayData: {
            callForwarder: swAddress,
          },
        };
    const relayClient= new RelayClient()
        console.log(relayClient)
    const transaction: Transaction = await relayClient.relayTransaction(relayTransactionOpts);
      setState({
        open: true,
        Transition: Fade,
      });
      setErrorMessage('You have successfully added a cash point ' + transaction);
    };

    const getProviderWallet = async () => {
        const account = await provider?.getSigner().getAddress();
        console.log(`Your wallet address is ${account}`);
        return account;
      };

    const getCashPoints = async () => {
      console.log('line 454:',smartWalletAddress)
      try {
        const checkIfRegistered = await cashPointsContract.cashpoints(smartWalletAddress);
        setIsCashPoint(checkIfRegistered._isCashPoint);

    } catch (error) {
        console.error("Error fetching cashpoint:", error);
    }
        if (!ethereum) {
            alert('please install metamask');
        } else {
            const account = await getProviderWallet();
            setAccount(account); 
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setWalletAddress(accounts[0]);

            let NumberOfCashPointsTXN = await cashPointsContract.count();
            let count = NumberOfCashPointsTXN.toNumber();
            console.log('number of cashpoints:', count);
            let cashPoints = [];
            let active = [];
            for (let i = 1; i <= count; i++) {
                let CashPointAddress = await cashPointsContract.keys(i);
                let CashPoint = await cashPointsContract.getCashPoint(CashPointAddress);
                let now = new Date();
                let cpDate = new Date(CashPoint._endTime);
                active.push(cpDate >= now);
                console.log(CashPoint)
                cashPoints.push(CashPoint);
            }
            setIsActive(active);
            getData(cashPoints);
            
        }
    }



    // Modal to capture user email and location
    const handleEmailModalOpen = () => {
        setOpenEmailModal(true);
    };

    const handleEmailModalClose = () => {
        setOpenEmailModal(false);
    };

    const handleEmailSubmit = async () => {
        const scriptURL = emailScriptURL; 
        console.log(email,location);
        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ email, location }),
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            console.log(result); // Should log "Success"
            setOpenEmailModal(false);
        } catch (error) {
            console.error('Error submitting email:', error);
            setOpenEmailModal(false);
        }
    };

    return (
        <div className='min-h-screen flex flex-col text-slate-500'>
            <NavBar walletAddress={smartWalletAddress} eoa={account} tokenBalance={smartWalletBalance} />
            
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
            <main className='text-black container mx-auto pt-16 flex-1 text-left'>
            
                    <h4 className='text-xl text-slate-700 lg:text-2xl uppercase text-left py-6'>Find a cashpoint:</h4>
                   
            <div id="map" ref={mapRef} style={{ width: '100%', height: '500px' }} />
            <div className="flex justify-center">
                <Button className="z-100 text-white bg-[#872A7F] mb-2 mt-2 py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F] hover:border hover:border-[#872A7F] focus:outline-none focus:ring" onClick={handleOpenCreate}>
                    Become A Cashpoint
                </Button>
            </div>
                {currentCashPoint && cardPosition && (
                <Card sx={{ maxWidth: 500, position: 'absolute', top: cardPosition.top, left: cardPosition.left, zIndex: 1000 }}>
                    <CardHeader title={currentCashPoint.name} />
                    <CardContent>
                        <Typography>
                            <LocationOnIcon /> {currentCashPoint.city}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Currency: {currentCashPoint.currency}
                        </Typography>
                        <Typography variant="body2">
                            Buy: {currentCashPoint.buyRate} Sell: {currentCashPoint.sellRate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Valid Until: {currentCashPoint.until}
                        </Typography>
                        <Typography variant="body2">
                            <PhoneIcon /> {currentCashPoint.phoneNumber}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button size="small" onClick={() => setOpenSend(true)}>Withdraw</Button>
                    </CardActions>
                </Card>
            )}
            
       <AddCashPoint open={openCreate} close={closeCreate} update={isCashPoint} add={createCashPointHandler}></AddCashPoint>
                <div className='my-4'>
                    <Link className='text-[#872A7F] ' color="inherit" component='button' onClick={handleEmailModalOpen}>
                        Can’t find a cash point at your desired location?
                    </Link>
                </div>
  
                <Dialog open={openEmailModal} onClose={handleEmailModalClose}>
                    <DialogTitle>Leave your email and location</DialogTitle>
                    <DialogContent>
                    <DialogContentText>
                      We will let you know when we have a cashpoint available at your desired location.
                    </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="email"
                            label="Email Address"
                            type="email"
                            fullWidth
                            variant="standard"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            id="location"
                            label="Desired Location"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEmailModalClose}>Cancel</Button>
                        <Button onClick={handleEmailSubmit}>Submit</Button>
                    </DialogActions>
                </Dialog>
 
            </main>
        </div>
    );
};

export default CashPoints;

