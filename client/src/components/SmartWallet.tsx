import{
    getSmartWalletAddress,
    UserDefinedDeployRequest,
  } from '@rsksmart/rif-relay-client';
  import {
    RelayClient,
    setEnvelopingConfig,
    setProvider,
  } from '@rsksmart/rif-relay-client';
  import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

const SmartWallet = () => {

    const ethereum = (window as any).ethereum;
  const provider = ethereum ? new ethers.providers.Web3Provider(ethereum) : null;
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

    const account = await getProviderWallet();
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

  return (<>
  <p>{smartWalletAddress}</p>
  </>)

}
export default SmartWallet