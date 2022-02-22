import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import abi from "./utils/PunchContractABI.json";


import './App.css';

function App() {
  const contractABI = abi.abi;
  const contractAddress = "0x04b065b6B54Ef2171f36ceaE90E2689171514C17";

  type Punch = {
    address: string,
    timestamp: Date,
    message: string
  };

  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [punchCount, setPunchCount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [allPunches, setAllPunches] = useState<Punch[]>([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the Ethereum object", ethereum);


        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account: ", account);
          setCurrentAccount(account);
          getCount();
          getAllPunches();
        } else {
          console.log("No authorized account found");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    let contract: ethers.Contract;

    const onNewPunch = (from: string, timestamp: number, message: string) => {
      console.log("NewPunch", from, timestamp, message);
      const newPunch: Punch = {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      }
      setAllPunches(prevState => [...prevState, newPunch])
    }

    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        contract = new ethers.Contract(contractAddress, contractABI, signer);
        contract.on("NewPunch", onNewPunch);
      }
    } catch (error) {
      console.log(error)
    }

    return () => {
      if (contract) {
        contract.off("NewPunch", onNewPunch);
      }
    };
    // eslint-disable-next-line
  }, []);

  const doPunch = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await contract.getTotalPunches();
        console.log("Retreived total punch count...", count.toNumber());

        const tx = await contract.punch(message);

        await tx.wait();

        count = await contract.getTotalPunches();
        console.log("Retreived total punch count...", count.toNumber());
        getAllPunches();
        getCount();
      } else {
        console.log("Ethereum object doesn't exists");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCount = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await contract.getTotalPunches();
        console.log("Retreived total punch count...", count.toNumber());

        setPunchCount(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exists");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllPunches = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const allPunches = await contract.getAllPunches();

        let punchesCleaned: Punch[] = [];
        allPunches.forEach((x: any) => {
          let curr: Punch = {
            address: x.puncher,
            timestamp: new Date(x.timestamp * 1000),
            message: x.message
          }
          punchesCleaned.push(curr)
        });

        setAllPunches(punchesCleaned);
      } else {
        console.log("Ethereum object doesn't exists");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateMessage = async (_e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(_e.target.value);
  };

  return (
    <div className="flex justify-center mt-10">
      <div className="flex flex-col justify-center max-w-lg">
        <div className="text-center text-2xl font-semibold mt-4">
          👋 Hey there! 👊 Punch Me!
        </div>

        <div className="text-center text-gray-700 mt-10">
          I deployed a bug to production, I should be punched!
          <p>I got punched for {punchCount} times so far!</p>
          <p className="mt-2 text-sm font-semibold">
            You might get lucky to receive ETH 😉
          </p>
        </div>

        {!currentAccount && (
          <button className="cursor-pointer mt-4 p-2 border-1 bg-blue-600 rounded-md text-white hover:bg-blue-700" onClick={connectWallet}>
            Connect MetaMask
          </button>
        )}

        <div className="flex flex-col mt-10 text-gray-700">
          <label className="text-gray-700 p-1">Send message</label>
          <input className="p-3 border rounded-md border-gray-400" onChange={e => updateMessage(e)} placeholder="Send me a message with your punch..."></input>
        </div>

        <button className="cursor-pointer mt-4 px-2 py-4 border-1 bg-orange-600 rounded-lg font-bold text-white hover:bg-orange-700" onClick={doPunch}>
          1x Punch! 👊
        </button>

        <div className="mt-5">
          {allPunches.map((punch, index) => {
            return (
              <div className="py-3 px-3 bg-orange-300 mb-3 rounded-md" key={index}>
                <div className="bg-orange-700/40 rounder rounded-md px-3 py-2 italic text-sm text-gray-100">
                  {punch.message}
                </div>
                <div className="flex flex-col mx-1 mt-2 text-sm pl-1">
                  <a className="hover:text-gray-700" href={"https://rinkeby.etherscan.io/address/" + punch.address}>{punch.address}</a>
                  <div className="">{punch.timestamp.toLocaleString()}</div>
                </div>
              </div>)
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
