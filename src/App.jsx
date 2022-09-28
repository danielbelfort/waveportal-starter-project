import React, { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "../contracts/WavePortal.json";
import WaveList from "../components/WaveList";
import classNames from "classnames";
import Spinner from "../components/Spinner";

// v4
export default function App() {
  // state variables
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveList, setWaveList] = useState([]);
  const [totalWaves, setTotalWaves] = useState("");
  const [tweetValue, setTweetValue] = useState("");
  const [walletNetwork, setNetwork] = useState(null);
  const [writeLoading, setWriteLoading] = useState(false);
  
  // Metamask network variables
  const networkName = useMemo(() => {
		if (!walletNetwork) {
			return "";
		}
		return walletNetwork.name;
	}, [walletNetwork]);
  const isRinkeby = networkName === "rinkeby";

  // smart contract data
  const contractAddress = "0xd941a930aEf7C1C4acD16D3274Ff590181fef15F";
  const contractABI = abi.abi;
  
  // "is the wallet connected?"
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you install metamask");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      // check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // connect the wallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  // a call to setTotalWaves
  const loadTotalWaves = async () => {
    try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  
          let count = await wavePortalContract.getTotalWaves();
          setTotalWaves(count.toString());
  
        } else {
          console.log("Ethereum object doesn't exist");
        }
      } catch (error) {
        console.log(error)
      }
  }

  // call the contract to mine a wave
  // then load up the total waves state
  const wave = async () => {
    
    try {
      const { ethereum } = window; 
      if (ethereum) {
        // prep the txn
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        // call the smart contract txn function
        const waveTxn = await wavePortalContract.wave(tweetValue, { gasLimit : 300000 })
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        // clean-up
        loadTotalWaves();
        setWriteLoading(current => !current)
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // getter for all of the contract waves (always listening)
  const getAllWaves = async() => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // grab all the waves from the contract (cleanly) and set allWaves
        const waves = await wavePortalContract.getAllWaves();
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        setAllWaves(wavesCleaned);

        // on each new wave: announce it and change the AllWaves state
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);
          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // get the wallet's network
  const getNetwork = async() => {
  	if (!window.ethereum) {
  		return false;
  	}
  	const provider = new ethers.providers.Web3Provider(window.ethereum);
  	return provider.getNetwork();
  }

  // wave button handler
  const waveButtonHandler = () => {
    setWriteLoading(true)
    setTweetValue("")
    return wave()
  }

  /// STATE EFFECTS

  // first page pass
  useEffect(async () => {
    checkIfWalletIsConnected();
    loadTotalWaves();
    setNetwork(await getNetwork());
  }, [])

  // reload the page on each detected network change
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => { window.location.reload(); })
    }
  })

  // when there's a new wave or account first connects:
  // render the wave list
  useEffect(() => {
    <WaveList waveList={allWaves} />
  }, [allWaves, currentAccount])

  // for debugging purposes
  useEffect(() => {
    console.log('writeLoading is: ', writeLoading);
    console.log('currentAccount is: ', currentAccount);
  }, [writeLoading, currentAccount]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">

        <div className="header">
          Daniel's Immutable Guest Book 🍃
        </div>

        <div className="bio">
          Welcome! Whatever you post here is going on-chain and can't ever be changed.
        </div>

        <br></br>

        {/* if there is no currentAccount: render this button */}
        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
        </button>
        )}

        {/* if there is a currentAccount: render this button */}
        {/* taking into account the wallet's network */}
        {currentAccount && (
          <div className="justifyCenter">
             <div className="connected"></div>
             <span>Wallet Conected </span>
              {networkName != "rinkeby" && (
                  <div className="networkInvalid"> (Switch to Rinkeby) </div>
              )}
          </div>
        )}

        <br></br>

        {/* the text box */}
        <textarea className="input"
          name="tweetArea"
          rows="5"
          placeholder=""
          type="text"
          id="tweet"
          disabled = {!Boolean(currentAccount) || !isRinkeby}
          value={tweetValue}
          onChange={e => setTweetValue(e.target.value)}
        >
        </textarea>

        {/* the post button */}
        {!writeLoading && (
          <div className="justifyCenter">
            <button
              className="waveButton"
              onClick={waveButtonHandler}
              disabled = {!Boolean(currentAccount) || !isRinkeby || tweetValue == ""}
            >
              <b>Post Forever</b>
            </button>
          </div>
        )}

        {writeLoading && (
          <div className="justifyCenter">
            <Spinner />
            <div className="heartbeat">mining the transaction (takes a minute)</div>
          </div>
        )}

        {/* if there is a currentAccount: render this button */}
        {currentAccount && isRinkeby && (
          <div className="waveCount">
            Total Posts: {totalWaves}
          </div>
        )}

        <br></br>

        <WaveList waveList={allWaves} />

      </div>
    </div>
  );
}
