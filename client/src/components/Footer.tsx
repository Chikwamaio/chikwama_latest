import GitHubIcon from '@mui/icons-material/GitHub';
import React from 'react';

const Footer = () => {
    return(
        <>
        <footer className='mx-auto pb-6 flex flex-col md:flex-row md:w-fit w-full absolute bottom-0'>
        <p className='flex-row'>Built with ❤️ by the Chikwama community</p>

        <div>
          <a href='#' className='mr-3 hover:opacity-80 duration-150'>About us</a>|
          <a href='https://www.privacypolicies.com/live/9a2ebd42-f5f8-4a54-97d4-7234c87d8441' className='mx-3 hover:opacity-80 duration-150'>Privacy</a>|
          <a href='#' className='mx-3 hover:opacity-80 duration-150'>Contact</a>|
          <a href='https://github.com/Chikwama-io/ChikwamaWebsite' className='mx-3 hover:opacity-80 duration-150'><GitHubIcon className=' pb-0 mb-2 mr-1'></GitHubIcon>Github</a>
        </div>
      </footer>
        </>
    )
};

export default Footer;