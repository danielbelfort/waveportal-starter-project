import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "../contracts/WavePortal.json";
import WaveList from "../components/WaveList";
import classNames from "classnames";

export default function App() {
  // state variables
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveList, setWaveList] = useState([]);
  const [totalWaves, setTotalWaves] = useState("");
  const [tweetValue, setTweetValue] = useState("");

  // smart contract data
  const contractAddress = "0xd941a930aEf7C1C4acD16D3274Ff590181fef15F";
  const contractABI = abi.abi;

  // is the wallet connected? function
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

  useEffect(() => {
    checkIfWalletIsConnected();
    loadTotalWaves();
  }, [])

  // when there's a new wave or account just connects, render the wave list
  useEffect(() => {
    getAllWaves();
    loadTotalWaves();
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

        {/* if there is no currentAccount: render this button */}
        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
        </button>
        )}

        {/* if there is a currentAccount: render this button */}
        {currentAccount && (
          <div className="justifyCenter">
            <span className="connected" />
            Wallet Conected
          </div>
        )}

        <br></br>

        <textarea className="input"
          name="tweetArea"
          rows="5"
          placeholder="Hi! Cool stuff..."
          type="text"
          id="tweet"
          disabled = {!Boolean(currentAccount)}
          value={tweetValue}
          onChange={e => setTweetValue(e.target.value)}
        >
        </textarea>

        <button
          className="waveButton"
          onClick={wave}
          disabled = {!Boolean(currentAccount)}
        >
          <b>Post Forever</b>
        </button>

        {/* if there is a currentAccount: render this button */}
        {currentAccount && (
          <div className="waveCount">
            Total Posts: {totalWaves}
          </div>
        )}

        <WaveList waveList={allWaves} />

      </div>
    </div>
  );
}
