import fetch from "node-fetch";

export const fetchEthToInrRate = async (req, res) => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
    );
    const data = await response.json();
    const ethInrRate = data.ethereum.inr;
    res.json({ ethInrRate });
  } catch (error) {
    console.error("Error fetching ETH to INR rate:", error);
    res.status(500).json({ error: "Failed to fetch ETH to INR rate" });
  }
};
