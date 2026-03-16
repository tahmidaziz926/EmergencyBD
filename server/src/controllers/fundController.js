import FundRequest from "../models/FundRequest.js";

// Submit Fund Request
export const submitFundRequest = async (req, res) => {
  try {
    const { title, description, amountNeeded } = req.body;

    // Validate amount
    if (amountNeeded < 1) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const newFundRequest = new FundRequest({
      userId: req.user.id,
      title,
      description,
      amountNeeded
    });

    await newFundRequest.save();
    res.status(201).json({ message: "Fund request submitted successfully", fundRequest: newFundRequest });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get My Fund Requests
export const getMyFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find({ userId: req.user.id });
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};