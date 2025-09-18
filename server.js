const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const sendSMSRoute = require("../visa/src/sendSms"); // ✅ Import your Vonage route
app.use("/api", sendSMSRoute);             // Expose it at /api/send-sms

const PORT = 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
