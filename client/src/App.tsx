/// <reference types="vite/client" />
import './App.css'
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import LandingPage from './components/LandingPage';
import SmartWallet from './components/SmartWallet';
import Home from './components/Home';
import CashPoints from './components/CashPoints';
import Dao from './components/Dao';

function App() {
  
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/Landing' element={<LandingPage/>}></Route>
        <Route path='/Home' element={<Home/>}></Route>
        <Route path='/CashPoints' element={<CashPoints/>}></Route>
        <Route path='/SmartWallet' element={<SmartWallet/>}></Route>
        <Route path='/Dao' element={<Dao/>}></Route>
          <Route path='*'  element={<LandingPage />}>
          </Route>
          </Routes>
    </BrowserRouter> 
    </>
  )
}

export default App
