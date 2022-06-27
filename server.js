const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const scheduleRoutes = require("./api/routes/schedule");
const balanceRoutes = require("./api/routes/balance");
const usersRoutes = require("./api/routes/users");
const vehiclesRoutes = require("./api/routes/vehicles");
const announcementsRoutes = require("./api/routes/announcements");
const entitiesRoutes = require("./api/routes/entities");
const devicesRoutes = require("./api/routes/devices");
const activitiesRoutes = require("./api/routes/activities");
const app = express();

app.use(cors());
//Cross-origin resource sharing (CORS) is a mechanism that allows
//restricted resources on a web page to be requested from another
//domain outside the domain from which the first resource was served.

dotenv.config({ path: "./.env" });

// __dirname <-- get current directory

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json({ limit: "30mb" }));
// --------------------- CONNECTION -----------------------------

const port = process.env.PORT || 3000;
const connectionURI = process.env.MONGO_CONNECTION;

mongoose
  .connect(connectionURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((response) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${server.address().port}`);
      //console.log(response);
    });
  })
  .catch((err) => console.log(err));

// --------------------- API -------------------------------

app.get("/", (req, res) => {
  res.send("Welcome to getaways API");
});

app.use("/api/schedule", scheduleRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/entities", entitiesRoutes);

// ----------------------------------------------------------

//TODO https://stackoverflow.com/a/64655153/14718856   IMPORT SYNTAX
