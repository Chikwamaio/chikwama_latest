/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import './App.css'
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import LandingPage from './components/LandingPage';
import SmartWallet from './components/SmartWallet';

function App() {
  
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/Landing' element={<LandingPage/>}></Route>
        <Route path='/Home' element={<SmartWallet />}>
        </Route>

          <Route path='*'  element={<LandingPage />}>
          </Route>
          </Routes>
    </BrowserRouter> 
    </>
  )
}

export default App
