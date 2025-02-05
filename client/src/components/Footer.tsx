import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';

const Footer = () => {
  return (
    <footer className="shadow-md bg-gray-100 border-t flex-col justify-between items-center md:pl-24 md:pr-24 justify-between items-center fixed bottom-0 left-0 w-full z-50">
      

      <div className="flex flex-col md:flex-row items-center md:items-baseline mt-4 md:mt-0">
      <p>Built by the Chikwama community</p>
        <div className="flex space-x-3 pl-3">
          <a href="https://www.linkedin.com/in/chikwama" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 duration-150">
            <LinkedInIcon className="text-blue-700" />
          </a>
          <a href="https://twitter.com/chikwamaio" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 duration-150">
            <TwitterIcon className="text-blue-500" />
          </a>
          <a href="https://www.youtube.com/@ChikwamaDAO" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 duration-150">
            <YouTubeIcon className="text-red-600" />
          </a>
          <a href="https://github.com/Chikwamaio/chikwama_latest" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 duration-150">
            <GitHubIcon className="text-gray-800" />
          </a>
        </div>

        <div className="mt-3 md:mt-0 md:ml-4 text-center md:text-left">

          <a href="https://www.privacypolicies.com/live/9a2ebd42-f5f8-4a54-97d4-7234c87d8441" className="mx-3 hover:opacity-80 duration-150">
            Privacy Policy
          </a>


        </div>
      </div>
    </footer>
  );
};

export default Footer;