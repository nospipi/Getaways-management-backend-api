const express = require("express");
const router = express.Router();
const sendPushNotifications = require("../../utilities/sendPushNotifications");

const { UserModel, AnnouncementModel } = require("../../models/models");

// ---------------------- CREATE -------------------------------

// --> /api/announcements
router.post("/", (req, res) => {
  const announcement = new AnnouncementModel({
    body: req.body.body,
    critical: req.body.critical,
  });
  announcement
    .save()
    .then(async (response) => {
      //SEND NOTIFICATIONS TO USERS => STEP 1 - GET ALL USERS TOKENS -
      const tokensArray = await UserModel.find({
        _id: { $ne: process.env.ADMIN_ID }, //ne-not equal admin id
      })
        // .distinct("loggedDevices", (error, devices) => {
        //   // devices is an array of all ObjectIds
        //   return devices;
        // });
        .then((data) => {
          return [
            ...new Set(
              data
                // .filter((user) => user._id.toString() !== process.env.ADMIN_ID)
                .map((user) => user.loggedDevices.map((device) => device.token))
                .reduce((prev, curr) => [...prev, ...curr])
                .filter((token) => !token.includes("emulator")) // filter out emulator tokens
            ),
          ];
        });
      //SEND NOTIFICATIONS TO USERS => STEP 2 - SEND NOTIFICATION TO ALL TOKENS -
      sendPushNotifications(tokensArray, {
        title: "There is a new announcement from management!",
        body: req.body.body,
      }).then(() => {
        res.send("Announcement has published succesfully");
      });
    })
    .catch((error) => {
      if (error.name === "ValidationError") {
        // let errors = {};
        // Object.keys(error.errors).forEach((key) => {
        //   errors[key] = error.errors[key].message;
        // });

        res.status(400).send(error.message);
      }
    });
});

// ---------------------- READ --------------------------------

// --> /api/announcements
router.get("/", (req, res) => {
  AnnouncementModel.find()
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});
// --> /api/announcements/id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  AnnouncementModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});

// ---------------------- DELETE --------------------------------

// --> /api/announcements
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  AnnouncementModel.findByIdAndRemove(id)
    .then((data) => res.send("Announcement has deleted succesfully"))
    .catch((err) => res.send(err));
});

// --------------------------------------------------------------

module.exports = router;
