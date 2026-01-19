const LoyaltyCard = require("../../models/LoyaltyCard.js");
const Customer = require("../../models/Customer.js");

// Assign/Create Loyalty Card
const createLoyaltyCard = async (req, res) => {
    try {
        const { cardId, cardType, assignedTo, pointsBalance } = req.body;

        // Check if card exists
        const existingCard = await LoyaltyCard.findOne({ cardId });
        if (existingCard) {
            return res.status(409).json({ isOk: false, message: "Loyalty Card ID already exists" });
        }

        // Validate Customer if assigned
        if (assignedTo) {
            // Since we are using mock customers on frontend, the ID might not exist in backend DB yet.
            // But we created the model. For now, let's assume we just save the ID given.
            // In a real flow, we would check: 
            // const customer = await Customer.findById(assignedTo);
            // if (!customer) return res.status(404).json({ isOk: false, message: "Customer not found" });
        }

        const newCard = new LoyaltyCard({
            cardId,
            cardType,
            assignedTo,
            pointsBalance,
            issuedAt: new Date(),
            isActive: true
        });

        await newCard.save();

        res.status(201).json({
            isOk: true,
            data: newCard,
            message: "Loyalty Card assigned successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error", error: error.message });
    }
};

// Get Cards by Customer
const getCustomerLoyaltyCards = async (req, res) => {
    try {
        const { customerId } = req.params;
        const cards = await LoyaltyCard.find({ assignedTo: customerId });
        res.status(200).json({ isOk: true, data: cards });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isOk: false, message: "Internal server error" });
    }
};


module.exports = {
  createLoyaltyCard,
  getCustomerLoyaltyCards
};
