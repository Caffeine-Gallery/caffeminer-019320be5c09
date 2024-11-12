import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let isAuthenticated = false;
let intervalId;

const connectButton = document.getElementById("connectButton");
const connectSection = document.getElementById("connectSection");
const minerSection = document.getElementById("minerSection");
const depositForm = document.getElementById("depositForm");
const loadingOverlay = document.getElementById("loadingOverlay");

async function init() {
    authClient = await AuthClient.create();
    isAuthenticated = await authClient.isAuthenticated();
    
    if (isAuthenticated) {
        showMinerSection();
        updateStats();
        startRewardUpdates();
    }
}

async function connect() {
    try {
        showLoading();
        await authClient.login({
            identityProvider: "https://identity.ic0.app",
            onSuccess: () => {
                isAuthenticated = true;
                showMinerSection();
                updateStats();
                startRewardUpdates();
            },
        });
    } catch (error) {
        console.error("Connection failed:", error);
    } finally {
        hideLoading();
    }
}

async function updateStats() {
    if (!isAuthenticated) return;
    
    try {
        const deposit = await backend.getDeposit();
        const rewards = await backend.calculateRewards();
        
        document.getElementById("depositedAmount").textContent = `${deposit} ICP`;
        document.getElementById("miningRewards").textContent = `${rewards.toFixed(4)} CAFF`;
    } catch (error) {
        console.error("Failed to update stats:", error);
    }
}

function startRewardUpdates() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateStats, 10000); // Update every 10 seconds
}

async function handleDeposit(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById("depositAmount").value);
    if (!amount || amount <= 0) return;
    
    try {
        showLoading();
        await backend.deposit(amount);
        document.getElementById("depositAmount").value = "";
        await updateStats();
    } catch (error) {
        console.error("Deposit failed:", error);
    } finally {
        hideLoading();
    }
}

function showMinerSection() {
    connectSection.classList.add("d-none");
    minerSection.classList.remove("d-none");
}

function showLoading() {
    loadingOverlay.classList.remove("d-none");
}

function hideLoading() {
    loadingOverlay.classList.add("d-none");
}

// Event Listeners
connectButton.addEventListener("click", connect);
depositForm.addEventListener("submit", handleDeposit);

// Initialize the app
init();
