const express = require("express");
const router = express.Router();
const { ActivityModel } = require("../../models/models");

// ---------------------- CREATE -------------------------------

// --> /api/activities
router.post("/", (req, res) => {
  const newActivity = new ActivityModel({
    type: req.body.type,
  });

  ActivityModel.findOne({ type: req.body.type }, (err, type) => {
    if (err) {
      res.send(err);
      return;
    }
    if (type) {
      res.status(422).send("There is already an activity of this type !"); //if there is send back this message..
    } else {
      newActivity
        .save()
        .then((response) => {
          res.send("Activity has created succesfully");
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
    }
  });
});

// ---------------------- READ --------------------------------

// --> /api/activities
router.get("/", (req, res) => {
  ActivityModel.find()
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});
// --> /api/activities/id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  ActivityModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});

// ---------------------- UPDATE -----------------------------------------------------------------------

// --> /api/activities/:id
router.patch("/:id", (req, res) => {
  const id = req.params.id;

  ActivityModel.findById(id)
    .then((activityEntry) => {
      activityEntry.type = req.body.type;
      return activityEntry.save();
    })
    .then((result) => res.send("Succesfully updated"))
    .catch((err) => res.send(err));
});

// ---------------------- DELETE ----------------------------------------------------------------------------

// --> /api/activities/id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  ActivityModel.findByIdAndRemove(id)
    .then((data) => res.send("Activity has deleted succesfully"))
    .catch((err) => res.send(err));
});

// --------------------------------------------------------------

module.exports = router;
