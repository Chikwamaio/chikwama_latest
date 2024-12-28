import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {  useState } from 'react';
import chikwamaLogo from '../assets/Icon100.png';

type Prop = {
    walletAddress: string;
    eoa: string;
  };

const connectWalletHandler = async (address: string) => 
{
    const ethereum = (window as any).ethereum;

    if(!ethereum)
    {
      console.log('please install metamask');
    }

      try 
      {
          const accounts = await ethereum.request({ method: 'eth_requestAccounts'});
          console.log(accounts[0]);
        navigator.clipboard.writeText(address).then(() => {
            console.log('Address copied to clipboard');
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
      }
      catch(error)
      {
        console.log(error);
      }
      
}


const NavBar = ({walletAddress, eoa}:Prop) => {
  let [menuOpen, setMenuOpen] = useState(false);
  const address = walletAddress;
  const EOA = eoa;

  const handleOpenMenu = () =>
  {
    setMenuOpen(!menuOpen);
  }


    return(
        <>
        
        <div className="bg-white shadow-md md:pl-24 md:pr-24 fixed top-0 left-0 w-full z-50">
          <div className="md:flex items-center justify-between bg-white py-4 md:px-2 px-2">
            <div>
         <a href="/Home" className="cursor-pointer uppercase">
         <span className="mr-1 pt-2">
        <img
          className="h-10  inline"
          src={chikwamaLogo}
          alt="Chikwama Logo"
        />
        </span>
        Chikwama
      </a>
      </div>
      <div className="text-3xl absolute right-8 top-4 cursor-pointer">
        <span className="text-3xl cursor-pointer md:hidden block inline"><IconButton onClick={handleOpenMenu}> {menuOpen? <CloseIcon/> : <MenuIcon/> }</IconButton></span>
      </div>
     <div>
        <ul className={`md:flex md:items-center md:pb-0 pb-12 absolute md:static bg-white md:z-auto z-[-1] left-0 w-full md:w-auto md:pl-0 pl-9 md:pt-0 pt-6 transition-all duration-500 ease-in ${menuOpen ? 'top-20 opacity-100':'top-[-490] md:opacity-100 opacity-0'} `}>
        <li className="cursor-pointer md:mt-0 mt-2 mr-3 hover:text-fuchsia-700"><a href='/cashpoints'>Cashpoints</a></li>
        <li className="cursor-pointer md:mt-0 mt-2 mr-3 hover:text-fuchsia-700"><a href='/dao'>DAO</a></li>
   
        <button onClick={() => connectWalletHandler(address)} className="text-white w-[160px] truncate md:mt-0 bg-[#872A7F]   py-2 px-5 rounded drop-shadow-xl border border-transparent hover:bg-transparent hover:text-fuchsia-700 hover:border hover:border-fuchsia-700 focus:outline-none focus:ring ${}">
        {address.length > 0?  address: "Connect"}
        </button>
        <div className='group aboslute right-0 top-0'>
        <HelpOutlineIcon/>
            <div className='hidden group-hover:block absolute right-20 bg-gray-800 text-white text-sm p-2 rounded-lg shadow-md w-60 tooltip-container break-words'>
            This is your Chikwama wallet address, it is connected to the account: {EOA} in your MetaMask wallet. Click it to copy!
            </div>
            </div>
      
        </ul>
        
        </div>
     
        </div>
      </div>
      
      </>
    );
     
};

export default NavBar;