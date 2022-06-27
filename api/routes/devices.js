const express = require("express");
const router = express.Router();
const { UserModel } = require("../../models/models");

// ---------------------- CREATE -------------------------------

//no create routes

// ---------------------- READ --------------------------------

//no read routes

// ---------------------- UPDATE -----------------------------------------------------------------------

// --> /api/devices/id/token
router.patch("/:id/:token", (req, res) => {
  const id = req.params.id;
  const token = req.params.token;

  UserModel.updateOne(
    { _id: id, "loggedDevices.token": token },
    {
      $set: {
        "loggedDevices.$.device": req.body.name,
      },
    }
  )
    .then((result) => res.send(" Succesfully update device name"))
    .catch((error) => {
      console.log(error.message);
      res.status(400).send(error.message);
    });
});

// ---------------------- DELETE ----------------------------------------------------------------------------

// --> /api/devices/id/token
router.delete("/:id/:token", (req, res) => {
  const id = req.params.id;
  const token = req.params.token;

  UserModel.findById(id)
    .then((user) => {
      user.loggedDevices = user.loggedDevices.filter(
        (device) => device.token !== token
      );
      return user.save();
    })
    .then((result) => res.send(" Succesfully deleted device"))
    .catch((error) => {
      console.log(error.message);
      res.status(400).send(error.message);
    });
});

// --------------------------------------------------------------

module.exports = router;
