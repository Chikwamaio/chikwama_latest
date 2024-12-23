/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import './App.css'
import{
  getSmartWalletAddress,
  UserDefinedDeployRequest,
} from '@rsksmart/rif-relay-client';
import {
  RelayClient,
  setEnvelopingConfig,
  setProvider,
} from '@rsksmart/rif-relay-client';

export type SmartWallet = {
  index: number;
  address: string;
  isDeployed: boolean;
  tokenBalance: string;
  rbtcBalance: string;
};

function App() {
  const ethereum = (window as any).ethereum;
  const provider = ethereum ? new ethers.providers.Web3Provider(ethereum) : null;
  const [walletAddress, setWalletAddress] = useState<string>('');
  const FORTY_SECONDS = 40 * 1000;


  const checkWalletIsConnected = async () => {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts'});

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

  if(provider)
  setProvider(provider);


  const relayClient= new RelayClient()

  const relaySmartWalletDeployment = async (
    tokenAmount: string
  ) => {
    try {
      const relayTransactionOpts: UserDefinedDeployRequest = {
        request: {
          from: accounts[0],
          tokenAmount,
          tokenContract: '0xdac5481925A298B95Bf5b54c35b68FC6fc2eF423',
          index: 3,
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

    return undefined;
  };

  relaySmartWalletDeployment('1');
  }

  useEffect(() => {
    checkWalletIsConnected(); 
  }, [])

  return (
    <>
      <p>{walletAddress}</p>
    </>
  )
}

export default App
