import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "../contracts/WavePortal.json";
import WaveList from "../components/WaveList";

export default function App() {
  // state variables
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveList, setWaveList] = useState([]);
  const [totalWaves, setTotalWaves] = useState("")
  const [tweetValue, setTweetValue] = useState("")

  // smart contract data
  const contractAddress = "0xd941a930aEf7C1C4acD16D3274Ff590181fef15F";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you install metamask");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /* Check if we're authorized to access the user's wallet */
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
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waveTxn = await wavePortalContract.wave(tweetValue, { gasLimit : 300000 })
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        loadTotalWaves();

      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error)
    }
  }

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

  const getAllWaves = async() => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
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

  useEffect(() => {
    checkIfWalletIsConnected();
    loadTotalWaves();
  }, [])

  // when “currentAccount” changes out of "" or when there is a new wave
  // Render all posted messages
  useEffect(() => {
    <WaveList waveList={allWaves} />
  }, [currentAccount, allWaves])

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

        {/* If there is no currentAccount render this button */}
        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
        </button>
        )}

        <br></br>

        <textarea
          name="tweetArea"
          rows="5"
          placeholder="Hi! Cool stuff..."
          type="text"
          id="tweet"
          value={tweetValue}
          onChange={e => setTweetValue(e.target.value)}
        >
        </textarea>
      
        <button className="waveButton" onClick={wave}>
          <b>Post Forever</b>
        </button>

        <div className="waveCount">
          Total Posts: {totalWaves}
          {/*<TotalPosts/>*/}
        </div>

        <WaveList waveList={allWaves} />

      </div>
    </div>
  );
}
