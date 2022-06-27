const express = require("express");
const router = express.Router();
const { UserModel } = require("../../models/models");
const sendPushNotifications = require("../../utilities/sendPushNotifications");
const { omit } = require("lodash");
// ---------------------- CREATE -------------------------------

// --> /api/users
router.post("/", async (req, res) => {
  const newUser = new UserModel({
    name: req.body.name,
    username: req.body.username,
    password: req.body.password,
    contact: {
      tel: req.body.tel,
      email: req.body.email,
    },
    roles: req.body.roles,
    loggedDevices: [],
  });

  newUser
    .save()
    .then(() => {
      res.send("Staff member profile has created succesfully");
    })
    .catch((error) => {
      if (error.name === "ValidationError") {
        // let errors = {};
        // Object.keys(error.errors).forEach((key) => {
        //   errors[key] = error.errors[key].message;
        // }); //to be send as object to client,in order to handle errors individually
        res.status(400).send(error.message);
      } else {
        res.status(400).send(error.toString());
      }
    });
});

// ---------------------- READ --------------------------------

// --> /api/users
router.get("/", (req, res) => {
  UserModel.find()
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});
// --> /api/users/id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  UserModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});

// --> /api/users/-USER_ID-/auth/-Password-
router.get("/:id/auth/:password", (req, res) => {
  const user_id = req.params.id;
  const password = req.params.password;

  UserModel.findById(user_id)
    .then((user) => {
      res.send({
        ...omit(user._doc, ["password"]), // --  .lean() -- https://stackoverflow.com/a/25769220/14718856
        auth: user.password === password ? true : false,
      });
    })
    .catch((err) => res.send(err.toString()));
});

// ---------------------- UPDATE -----------------------------------------------------------------------

// --> /api/users/update/:id
router.patch("/update/:id", (req, res) => {
  const id = req.params.id;

  let devicesObj = {
    token: req.body.token,
    device: req.body.device,
  };

  UserModel.findById(id)
    .then((userEntry) => {
      userEntry.name = req.body.name ? req.body.name : userEntry.name;
      userEntry.username = req.body.username
        ? req.body.username
        : userEntry.username;
      userEntry.password = req.body.password
        ? req.body.password
        : userEntry.password;
      userEntry.contact.tel = req.body.tel
        ? req.body.tel
        : userEntry.contact.tel;
      userEntry.contact.email = req.body.email
        ? req.body.email
        : userEntry.contact.email;
      userEntry.roles = req.body.roles ? req.body.roles : userEntry.roles;

      userEntry.loggedDevices = req.body.token //if field "token" exists in request body
        ? userEntry.loggedDevices.some((obj) => obj.token === devicesObj.token) //check if the existing array includes a same token
          ? userEntry.loggedDevices //if it includes it,then pass the existing array of notification objects
          : [...userEntry.loggedDevices, devicesObj] //if not,spread the existing array,and add a new object
        : userEntry.loggedDevices; //if field "token" does not exist pass the previous object
      //TODO loggeddevices logic has been replaced by update_tokens route,keeping it until client side is updated

      return userEntry.save();
    })
    .then(() => res.send("Succesfully updated"))
    .catch((error) => {
      if (error.name === "ValidationError") {
        res.status(400).send(error.message);
      } else {
        res.status(400).send(error.toString());
      }
    });
});

// --> /api/users/update_tokens/:id
router.patch("/update_tokens/:id", (req, res) => {
  const id = req.params.id;

  let devicesObj = {
    token: req.body.token,
    device: req.body.device,
  };

  UserModel.findById(id)
    .then((userEntry) => {
      if (
        !userEntry.loggedDevices.some((obj) => obj.token === req.body.token)
      ) {
        //if the array does not include the token
        userEntry.loggedDevices = [...userEntry.loggedDevices, devicesObj];
        return userEntry.save().then(() => {
          return sendPushNotifications([req.body.token], {
            title: "Welcome to Getaways Management !",
            body: `This is your first login on this device (${req.body.device})`,
          });
        });
      }
    })
    .then(() => res.send("Succesfully updated notifications tokens"))
    .catch((error) => {
      if (error.name === "ValidationError") {
        res.status(400).send(error.message);
      } else {
        res.status(400).send(error.toString());
      }
    });
});

// ---------------------- DELETE ----------------------------------------------------------------------------

// --> /api/users/id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  UserModel.findByIdAndRemove(id)
    .then((data) => res.send("Staff member has deleted succesfully"))
    .catch((err) => res.send(err));
});

// --------------------------------------------------------------

module.exports = router;
