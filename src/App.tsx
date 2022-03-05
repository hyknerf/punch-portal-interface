import React, { useState, useEffect } from "react";
import { BigNumber, ethers } from "ethers";
import abi from "./utils/PunchContractABI.json";

import "./App.css";

function App() {
  const contractABI = abi.abi;
  const contractAddress = "0x04b065b6B54Ef2171f36ceaE90E2689171514C17";
  const network = "rinkeby";
  const alchemyApiKey = "Oce04uIbf6YvqvvyqTQV3sc1BvFQs3BV";

  type Punch = {
    address: string;
    timestamp: Date;
    message: string;
  };

  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [punchCount, setPunchCount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [allPunches, setAllPunches] = useState<Punch[]>([]);
  const [haveMetaMask, setHaveMetaMask] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string>("");
  const [contractBalance, setContractBalance] = useState<BigNumber>(BigNumber.from(0));

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        setHaveMetaMask(true);
        console.log("We have the Ethereum object", ethereum);

        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account: ", account);
          setCurrentAccount(account);
          chainChanged();
        } else {
          console.log("No authorized account found");
        }
      }
      getCount();
      getContractBalance();
      getAllPunches();
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

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

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
      };
      setAllPunches((prevState) => [newPunch, ...prevState]);
    };

    try {
      const { ethereum } = window as any;
      if (ethereum) {
        setHaveMetaMask(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        contract = new ethers.Contract(contractAddress, contractABI, signer);
        contract.on("NewPunch", onNewPunch);
        ethereum.on("chainChanged", chainChanged);
        ethereum.on("accountsChanged", accountChanged);
      }
    } catch (error) {
      console.log(error);
    }

    return () => {
      if (contract) {
        contract.off("NewPunch", onNewPunch);
      }
    };
    // eslint-disable-next-line
  }, []);

  const chainChanged = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const chainId = await ethereum.request({ method: "eth_chainId" });
        setChainId(chainId);
      }
    } catch (error) {
      console.log("unable to determine the chaindId");
    }
  };

  const accountChanged = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        setCurrentAccount(accounts[0]);
      }
    } catch (error) {
      console.log("unable to determine the account");
    }
  };

  const doPunch = async () => {
    try {
      const { ethereum } = window as any;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await contract.getTotalPunches();
        console.log("Retreived total punch count...", count.toNumber());

        const tx = await contract.punch(message);

        await tx.wait();

        count = await contract.getTotalPunches();
        console.log("Retreived total punch count...", count.toNumber());
        getAllPunches();
        getContractBalance();
        getCount();
      } else {
        console.log("Ethereum object doesn't exists");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getContractBalance = async () => {
    try {
      const provider = new ethers.providers.AlchemyProvider(
        network,
        alchemyApiKey
      );

      let balance = await provider.getBalance(contractAddress);
      console.log("Retreived contract balance...", balance);
      setContractBalance(balance);
    } catch (error) {
      console.log("failed to fetch contract balance");
      console.trace(error)
    }
  };

  const getCount = async () => {
    try {
      const provider = new ethers.providers.AlchemyProvider(
        network,
        alchemyApiKey
      );
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      let count = await contract.getTotalPunches();
      console.log("Retreived total punch count...", count.toNumber());

      setPunchCount(count.toNumber());
    } catch (error) {
      console.log("111111");
      console.log(error);
    }
  };

  const getAllPunches = async () => {
    try {
      const provider = new ethers.providers.AlchemyProvider(
        network,
        alchemyApiKey
      );
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      const allPunches = await contract.getAllPunches();

      let punchesCleaned: Punch[] = [];
      allPunches.forEach((x: any) => {
        let curr: Punch = {
          address: x.puncher,
          timestamp: new Date(x.timestamp * 1000),
          message: x.message,
        };
        punchesCleaned.push(curr);
      });

      setAllPunches(punchesCleaned.reverse());
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
        <div className="mt-4 text-2xl font-semibold text-center">
          👋 Hey there! 👊 Punch Me!
        </div>
        <div className="mt-10 text-center text-gray-700">
          I deployed a bug to production, I should be punched!
          <p>I got punched for {punchCount} times so far!</p>
          <p className="flex justify-center mt-2 text-sm font-semibold">
            You might get lucky to receive <div className="px-1 mx-1 text-white bg-red-500 rounded py-1/2"> {ethers.utils.formatUnits(contractBalance, "ether")} </div> ETH 😉
          </p>
        </div>
        {!currentAccount &&
          (haveMetaMask ? (
            <button
              className="p-2 mt-4 text-white bg-blue-600 rounded-md cursor-pointer border-1 hover:bg-blue-700"
              onClick={connectWallet}
            >
              Connect with MetaMask
            </button>
          ) : (
            <button
              className="p-2 mt-4 text-white bg-gray-400 rounded-md border-1"
              disabled={true}
            >
              Get MetaMask
            </button>
          ))}

        {currentAccount && (
          <div className="mt-2 text-sm font-semibold">
            Hi, {currentAccount}!
          </div>
        )}

        <div className="flex flex-col mt-10 text-gray-700">
          <label className="p-1 text-gray-700">Send message</label>
          <input
            className="p-3 border border-gray-400 rounded-md"
            onChange={(e) => updateMessage(e)}
            placeholder="Send me a message with your punch..."
          ></input>
        </div>
        {chainId === "0x4" ? (
          <button
            className="px-2 py-4 mt-4 font-bold text-white bg-orange-600 rounded-lg cursor-pointer border-1 hover:bg-orange-700"
            onClick={doPunch}
          >
            1x Punch! 👊
          </button>
        ) : (
          <button className="px-2 py-4 mt-4 font-bold text-white bg-gray-400 rounded-lg cursor-default border-1">
            Not on Rinkeby Network
          </button>
        )}

        <div className="mt-5">
          {allPunches.map((punch, index) => {
            return (
              <div
                className="px-3 py-3 mb-3 bg-orange-300 rounded-md"
                key={index}
              >
                <div className="px-3 py-2 text-sm italic text-gray-100 rounded-md bg-orange-700/40 rounder">
                  {punch.message}
                </div>
                <div className="flex flex-col pl-1 mx-1 mt-2 text-sm">
                  <a
                    className="hover:text-gray-700"
                    href={
                      "https://rinkeby.etherscan.io/address/" + punch.address
                    }
                  >
                    {punch.address}
                  </a>
                  <div className="">{punch.timestamp.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
