const express = require("express");
const router = express.Router();
const { VehicleModel } = require("../../models/models");

// ---------------------- CREATE -------------------------------

// --> /api/vehicles
router.post("/", (req, res) => {
  // Finds the validation errors in this request and wraps them in an object with handy functions

  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(422).json({ errors: errors.array() });
  // }

  const vehicles = new VehicleModel({
    plate: req.body.plate,
  });

  VehicleModel.findOne({ plate: req.body.plate }, (err, vehicle) => {
    //check if there is already someone with the same name..
    if (err) {
      res.send(err);
      return;
    }
    if (vehicle) {
      res.status(422).send("There is already a vehicle with this plate !"); //if there is send back this message..
    } else {
      //else create a profile with given data..
      vehicles
        .save()
        .then((response) => {
          res.send("Vehicle is added succesfully");
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

// --> /api/VEHICLES
router.get("/", (req, res) => {
  VehicleModel.find()
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});
// --> /api/users/id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  VehicleModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});

// ---------------------- UPDATE -----------------------------------------------------------------------

// --> /api/vehicles/:id
router.patch("/update/:id", (req, res) => {
  const id = req.params.id;

  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(422).json({ errors: errors.array() });
  // }

  VehicleModel.findById(id)
    .then((vehicle) => {
      vehicle.plate = req.body.plate;
      return vehicle.save();
    })
    .then((result) => res.send(" Succesfully updated vehicle plate number"))
    .catch((error) => {
      console.log(error.message);
      if (error.name === "ValidationError") {
        // let errors = {};
        // Object.keys(error.errors).forEach((key) => {
        //   errors[key] = error.errors[key].message;
        // });

        res.status(400).send(error.message);
      }
    });
});

// ---------------------- DELETE ----------------------------------------------------------------------------

// --> /api/vehicles/id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  VehicleModel.findByIdAndRemove(id)
    .then((data) => res.send(`Vehicle has deleted succesfully`))
    .catch((err) => res.send(err));
});

// --------------------------------------------------------------

module.exports = router;
