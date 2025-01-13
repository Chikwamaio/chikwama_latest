import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIcon from '@mui/icons-material/Phone';
import {  Box, Card, CardActions, CardContent, CardHeader, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fade, Link, Stack, TextField, Typography } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { ethers, Transaction, utils } from 'ethers';
import { Feature, Map, View } from 'ol';
import { defaults as defaultControls } from 'ol/control';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import 'ol/ol.css';
import { fromLonLat, toLonLat } from 'ol/proj';
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
import SendMoney from './SendMoney';
import { SocialMediaModal } from './SocialMediaModal';
import CashIn from './CashIn';

const CashPoints = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [isCashPoint, setIsCashPoint] = useState(false);
    const [data, getData] = useState<any[]>([]);
    const [isActive, setIsActive] = useState<boolean[]>([]);
    const [smartWalletBalance, setSmartWalletBalance] = useState('');
    const [state, setState] = useState({ open: false, Transition: Fade });
    const [errorMessage, setErrorMessage] = useState('');
    const [username, setUsername] = useState('');
  
    
    // State for the email modal
    const [openEmailModal, setOpenEmailModal] = useState(false);
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');

    const abi = cashPoints.abi;
    const ethereum = (window as any).ethereum;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const tokenContract = import.meta.env.VITE_TOKEN_CONTRACT;
    const ChikwamaContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const emailScriptURL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_WEB_APP_URL;
    const cashPointsContract = new ethers.Contract(ChikwamaContractAddress, abi, signer);
    const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
    const [openSend, setOpenSend] = useState(false);
    const [openCashIn, setOpenCashIn] = useState(false);
    interface CashPoint {
        address: string;
        name: string;
        city: string;
        phoneNumber: string;
        currency: string;
        buyRate: number;
        sellRate: number;
        until: string;
        geometry: any[];
    }
    const [smartWalletAddress, setSmartWalletAddress] = useState<string>('');
    const FORTY_SECONDS = 40 * 1000;
    const [currentCashPoint, setCurrentCashPoint] = useState<CashPoint | null>(null);
    const [account, setAccount] = useState<string>('');
    const [openSocialModal, setOpenSocialModal] = useState(false);
    const [shareMessage, setShareMessage] = useState(''); 
    const [uniqueCities, setUniqueCities] = useState<string[]>([]);

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

    const closeSend = () => {
      setOpenSend(false);
    };

    const closeCashIn = () => {
      setOpenCashIn(false);
    };
    const sendMoneyHandler = async (amount: string, fee: string, gasFee: string, address: string, cashout: boolean) => {
      
      const balance = ethers.utils.parseUnits(smartWalletBalance, "ether");
      const amountEther = ethers.utils.parseUnits(amount, "ether");
      const feeEther = ethers.utils.parseUnits(fee, "ether");
      const gasFeeEther = ethers.utils.parseUnits(gasFee, "ether");
      const totalCost = amountEther.add(feeEther).add(gasFeeEther);

      
      const message = `I just converted my crypto dollars to money I can use here in ${currentCashPoint?.city}, thanks to Chikwama! Check it out at https://chikwama.net or follow @chikwamaio.`;
      setShareMessage(message);
      

      if (balance.lt(totalCost)) {
        setState({
          open: true,
          Transition: Fade,
        });
        setErrorMessage(
          `You have less than $${ethers.utils.formatEther(
            totalCost
          )} in your wallet ${smartWalletAddress}`
        );
        return;
      }
    
      try {

        await makeApproveCall( tokenContract, ChikwamaContractAddress, ethers.utils.formatEther(totalCost))
      
          const params = [amountEther, address]
          const funcData = calculateAbiEncodedFunction('send(uint amount,address _to)', params);

          const relayTransactionOpts: UserDefinedEnvelopingRequest = {
            request: {
              from: account,
              data: funcData,
              to: ChikwamaContractAddress,
              tokenAmount: 0,
              tokenContract: tokenContract,
            },
            relayData: {
              callForwarder: smartWalletAddress,
            },
          };
          const relayClient= new RelayClient();

          const transaction: Transaction = await relayClient.relayTransaction(relayTransactionOpts);
          setState({
            open: true,
            Transition: Fade,
          });
          setErrorMessage(`You have successfully sent $${amount} to ${address}! transaction hash: ${transaction.hash}`);
          
          closeSend();
          closeCashIn();
          setCurrentCashPoint(null);
          
          if(cashout){
            setOpenSocialModal(true);
          }

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
        const cps = data;

    
        cps.forEach((cp, index) => {

          const lat = parseFloat(ethers.utils.formatEther(cp[2] || "0")); 
          const long = parseFloat(ethers.utils.formatEther(cp[3] || "0"));
          const buyRate = parseFloat(ethers.utils.formatEther(cp[7] || "0")).toFixed(2);
          const sellRate = parseFloat(ethers.utils.formatEther(cp[8] || "0")).toFixed(2);

        const coords: [number, number] = [long, lat];

          const CashPoint = new Feature({
            geometry: new Point(fromLonLat(coords)),
            name: cp[0],
            address: cp.address,
            phoneNumber: cp[5],
            currency: cp._currency,
            buyRate: buyRate,
            sellRate: sellRate,
            until: cp[9],
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
          if(isActive[index]){
          vectorSource.addFeature(CashPoint);
          }
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
            zoom: 6,
          }),
          controls: defaultControls(),
        });
    



        map.on('click', (evt) => {
          const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f) as Feature<Point> | null;

          if (feature) {
            const geometry = feature.getGeometry()?.getCoordinates() || [];
            const transformedCoordinates = toLonLat(geometry);
            const [longitude, latitude] = transformedCoordinates;
            setCurrentCashPoint({
                address: feature.get('address'),
                name: feature.get('name'),
                city: feature.get('city'),
                phoneNumber: feature.get('phoneNumber'),
                currency: feature.get('currency'),
                buyRate: feature.get('buyRate'),
                sellRate: feature.get('sellRate'),
                until: feature.get('until'),
                geometry: [longitude, latitude],
            });
            setCardPosition({
              top: evt.pixel[1],
              left: evt.pixel[0],
            });
            
          } else {
            setCurrentCashPoint(null);
          }
        });


        const parentDiv = document.getElementById("zoomtolausanne"); 
        const spans = parentDiv?.querySelectorAll("span.MuiChip-label"); 

        if(spans){
        spans.forEach((span) => {
          span.addEventListener('click', () => {
            const city = span.textContent; 
            
            const cp = cps.find((cp) => cp.city.split(',')[0].trim() === city);
            if (cp && cp[2] !== undefined && cp[3] !== undefined)  {
              const lat = parseFloat(ethers.utils.formatEther(cp[2] || '0')); 
              const long = parseFloat(ethers.utils.formatEther(cp[3] || '0'));

              const coords = [long, lat];
              const location = new Feature({ geometry: new Point(fromLonLat(coords)) });
              const point = location.getGeometry();
              const size = map.getSize();
              const view = map.getView();
              const coordinates = point?.getCoordinates();

              if (coordinates && size) {
                view.centerOn(coordinates, size, [500, 200]);

              }
            } else {
              console.warn(`City "${city}" not found in data.`);
            }
          });
        });
        }
        return () => {
          map.setTarget('');
        };
     
    }, [data]);

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

  

    async function createCashPointHandler(cashPointName: any, phoneNumber: any, accuracy: any, currency: any, buyRate: any, sellRate: any, duration: number, fee: string, lat: any, long: any): Promise<void> {

      const basefee = await cashPointsContract.BASE_FEE();
      const mylat = lat.toString();
      const mylong = long.toString();
      const myAccuracy = accuracy.toString();
      const now = new Date();
      const scaledLat= ethers.utils.parseUnits(mylat, "ether");
      const scaledLong = ethers.utils.parseUnits(mylong, "ether");
      const scaledAccuracy = ethers.utils.parseUnits(myAccuracy, "ether");
      const buyEther = ethers.utils.parseUnits(buyRate, "ether");
      const sellEther = ethers.utils.parseUnits(sellRate, "ether");


      const swAddress = smartWalletAddress;
      const tokenAmount = 0;

      let city;

      var requestOptions = {
        method: 'GET',
      };
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`, requestOptions);
      const jsonResponse = await res.json();
      city = jsonResponse.results[0].address_components[2].long_name + ', ' + jsonResponse.results[0].address_components[4].long_name;
      //const cost = ethers.utils.parseUnits(fee, "ether");
      console.log("already registered:", isCashPoint);
      if(isCashPoint){  
        const formatedBaseFee = ethers.utils.formatEther(basefee);

        await makeApproveCall( tokenContract, ChikwamaContractAddress, duration==0?formatedBaseFee:fee)

        const CashPoint = await cashPointsContract.getCashPoint(smartWalletAddress);
        const currentEndtime = new Date(Date.parse(CashPoint._endTime));
        const IsActive = currentEndtime > now;
        const newEndtime = IsActive ? new Date(currentEndtime.setDate(currentEndtime.getDate() + duration)) : new Date(now.setDate(now.getDate() + duration));
        if(city){
          const params = [cashPointName, city, scaledLat, scaledLong, scaledAccuracy, phoneNumber, currency, buyEther, sellEther, newEndtime.toString(), duration]
          const funcData = calculateAbiEncodedFunction('updateCashPoint(string name, string  city, int256 latitude, int256 longitude, uint accuracy, string  phone, string currency, uint buy, uint sell, string endtime, uint duration)', params);

          const relayTransactionOpts: UserDefinedEnvelopingRequest = {
            request: {
              from: account,
              data: funcData,
              to: ChikwamaContractAddress,
              tokenAmount,
              tokenContract: tokenContract,
            },
            relayData: {
              callForwarder: swAddress,
            },
          };
          const relayClient= new RelayClient();

          const transaction: Transaction = await relayClient.relayTransaction(relayTransactionOpts);
          setState({
            open: true,
            Transition: Fade,
          });
          setErrorMessage(`You have successfully updated ${CashPoint.name} cash point ` + transaction);
        
        return;  
        }
        console.log('failed to access your location');
        return;
      }
      

      const endtime =  new Date(now.setDate(now.getDate() + duration));
      await makeApproveCall( tokenContract, ChikwamaContractAddress, fee)

      const params = [cashPointName, city, scaledLat, scaledLong, scaledAccuracy, phoneNumber, currency, buyEther, sellEther, endtime.toString(), duration]
      const funcData = calculateAbiEncodedFunction('addCashPoint(string name, string  city, int256 latitude, int256 longitude, uint accuracy, string  phone, string currency, uint buy, uint sell, string endtime, uint duration)', params)

    

        const relayTransactionOpts: UserDefinedEnvelopingRequest = {
          request: {
            from: account,
            data: funcData,
            to: ChikwamaContractAddress,
            tokenAmount,
            tokenContract: tokenContract,
          },
          relayData: {
            callForwarder: swAddress,
          },
        };
    const relayClient= new RelayClient()

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


            let NumberOfCashPointsTXN = await cashPointsContract.count();
            let count = NumberOfCashPointsTXN.toNumber();
            console.log('number of cashpoints:', count);
            let registeredCashPoints = [];
            let active = [];
            for (let i = 1; i <= count; i++) {
   
                let CashPointAddress = await cashPointsContract.keys(i);
                let CashPoint = await cashPointsContract.getCashPoint(CashPointAddress);
                let now = new Date();
                let cpDate = new Date(CashPoint._endTime);
                active.push(cpDate >= now);
                registeredCashPoints.push({
                  ...CashPoint,
                  address: CashPointAddress,
              });
            }
            setIsActive(active);
            getData(registeredCashPoints);

 
              
         
        }

    }

    useEffect(() => {
      const cities = data
        .filter((_, index) => isActive[index]) 
        .map((entry: any) => entry.city.split(",")[0].trim()); 
    
      const unique = Array.from(new Set(cities)); 
    
      setUniqueCities(unique);
      console.log("Updated uniqueCities state:", uniqueCities);
    }, [data, isActive]); 



    // Modal to capture user email and location
    const handleEmailModalOpen = () => {
        setOpenEmailModal(true);
    };

    const handleEmailModalClose = () => {
        setOpenEmailModal(false);
    };

    const handleEmailSubmit = async () => {
      const apiURL = 'http://localhost:5001/submit'; // Node.js API URL
      try {
          const response = await fetch(apiURL, {
              method: 'POST',
              body: JSON.stringify({ email, location }),
              headers: { 'Content-Type': 'application/json' },
          });
          const result = await response.json();
          console.log(result); // Should log "Success"
          setOpenEmailModal(false);
      } catch (error) {
          console.error('Error submitting email:', error);
          setOpenEmailModal(false);
      }
  };

    useEffect(() => {
      const result = data.find(item => item.address === smartWalletAddress);
      if(result) setUsername(result[0]);
    },[data])

    const handleCashIn = ()=>{
      setOpenCashIn(true);
      const currentcp = data.find(cp => cp.address === smartWalletAddress);

      const lat = parseFloat(ethers.utils.formatEther(currentcp[2] || "0")); 
      const long = parseFloat(ethers.utils.formatEther(currentcp[3] || "0"));
      const buyRate = parseFloat(ethers.utils.formatEther(currentcp[7] || "0")).toFixed(2);
      const sellRate = parseFloat(ethers.utils.formatEther(currentcp[8] || "0")).toFixed(2);
      const coords: [number, number] = [long, lat];

      
      setCurrentCashPoint({
        address: currentcp.address,
        name: currentcp[0],
        city: currentcp[1],
        phoneNumber: currentcp[5],
        currency: currentcp[6],
        buyRate: Number(buyRate),
        sellRate: Number(sellRate),
        until: currentcp[9],
        geometry: coords,
    });
    }



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
                    {isCashPoint && <p className='text-slate-700 mb-2'>Welcome back! You're signed in as <b>{username}</b> cashpoint.</p>}
                    <Stack
                    id="zoomtolausanne" 
      direction="row"
      spacing={2}
      sx={{ margin: "20px", flexWrap: "wrap", gap: 1 }}
    >
      {uniqueCities.map((city, index) => (
        <Chip key={index} label={city} color="secondary" variant="outlined" clickable/>
      ))}
    </Stack>
            <div id="map" ref={mapRef} style={{ width: '100%', height: '500px' }} />
            <div className="flex justify-center">
                <button className="z-100 text-white bg-[#872A7F] mb-2 mt-2 py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F] hover:border hover:border-[#872A7F] focus:outline-none focus:ring" onClick={handleOpenCreate}>
                    {isCashPoint?"Update Cashpoint details!":"Become a Cashpoint!"}
                </button>
                {isCashPoint &&<button onClick={handleCashIn} className="z-100 text-white bg-[#872A7F] ml-2 mb-2 mt-2 py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F] hover:border hover:border-[#872A7F] focus:outline-none focus:ring">Cash In!</button>}
            </div>
{currentCashPoint && cardPosition && (
  <Card 
  sx={{ 
    maxWidth: 400, 
    position: 'absolute', 
    top: cardPosition.top, 
    left: cardPosition.left, 
    zIndex: 1000, 
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)', 
    borderRadius: 3, 
    padding: 2 
  }}
>
  <CardHeader

  title={currentCashPoint.name}
/>
  <CardContent>
  <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
      <img
        src="/cp_image.jpg"
        alt="Chikwama Cashpoint Sticker"
        style={{ width: '100%', maxWidth: '350px', borderRadius: 5 }}
      />
    </Box>
    <Typography>
      <LocationOnIcon />{' '}
        <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.city}</span>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      <span>Currency:</span>{' '}
      <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.currency}</span>
    </Typography>
    <Typography variant="body2">
      <span>Buy:</span>{' '}
      <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.buyRate}</span>{' '}
      <span>Sell:</span>{' '}
      <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.sellRate}</span>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      <span>Valid Until:</span>{' '}
      <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.until}</span>
    </Typography>
    <Typography variant="body2">
      <PhoneIcon />{' '}
      <span style={{ fontFamily: 'Digital-7, monospace' }}>{currentCashPoint.phoneNumber}</span>
    </Typography>
  </CardContent>
  <CardActions>
    <button 
      className="text-white bg-[#872A7F] py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-[#872A7F] hover:border hover:border-[#872A7F] focus:outline-none focus:ring"
      onClick={() => { setOpenSend(true); }}
    >
      <AccountBalanceWalletIcon /> 
      CASH OUT
    </button>
  </CardActions>
</Card>
            )}
            
       <AddCashPoint open={openCreate} close={closeCreate} update={isCashPoint} add={createCashPointHandler}></AddCashPoint>
       <SendMoney open={openSend} close={closeSend} send={sendMoneyHandler} cashPoint={currentCashPoint} swAddress={smartWalletAddress} account={account}></SendMoney>
       <CashIn open={openCashIn} close={closeCashIn} send={sendMoneyHandler} cashPoint={currentCashPoint} swAddress={smartWalletAddress} account={account}></CashIn>
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
                        <button onClick={handleEmailModalClose}>Cancel</button>
                        <button onClick={handleEmailSubmit}>Submit</button>
                    </DialogActions>
                </Dialog>
 
                <SocialMediaModal
  open={openSocialModal}
  onClose={() => setOpenSocialModal(false)}
  message={shareMessage}
/>
            </main>
        </div>
    );
};

export default CashPoints;

