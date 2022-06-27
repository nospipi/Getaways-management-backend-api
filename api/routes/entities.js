const express = require("express");
const router = express.Router();
const _ = require("lodash");
const {
  UserModel,
  VehicleModel,
  AnnouncementModel,
  ActivityModel,
  FrequentMeetingPointModel,
} = require("../../models/models");

// ---------------------- READ --------------------------------

// --> /api/entities
router.get("/", async (req, res) => {
  const announcements = await AnnouncementModel.find();
  const users = await UserModel.find().select("-password");
  const vehicles = await VehicleModel.find();
  const activities = await ActivityModel.find();
  const frequentMeetingPoints = await FrequentMeetingPointModel.find().sort({
    frequency: "descending",
  });

  Promise.all([announcements, users, vehicles, activities]).then((values) => {
    res.send({
      announcements: announcements.reverse(),
      staff: users,
      vehicles: vehicles,
      activities: activities,
      frequentMeetingPoints: frequentMeetingPoints.map((point) => point.name),
    });
  });
});
module.exports = router;
