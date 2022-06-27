const express = require("express");
const router = express.Router();
const {
  ScheduleTaskModel,
  UserModel,
  FrequentMeetingPointModel,
} = require("../../models/models");
moment = require("moment-timezone");
const sendPushNotifications = require("../../utilities/sendPushNotifications");
const _ = require("lodash");

// ---------------------- CREATE -------------------------------

const addToFrequentMeetingPoints = async (meeting_points_arr) => {
  meeting_points_arr.forEach(async (meeting_point, index) => {
    const meeting_point_doc = await FrequentMeetingPointModel.findOne({
      name: meeting_point,
    });
    if (meeting_point_doc) {
      meeting_point_doc.frequency += 1;
      meeting_point_doc.save().then(() => {
        if (index === meeting_points_arr.length - 1) {
          return;
        }
      });
    } else {
      const new_meeting_point_doc = new FrequentMeetingPointModel({
        name: meeting_point,
        frequency: 1,
      });
      new_meeting_point_doc.save().then(() => {
        if (index === meeting_points_arr.length - 1) {
          return;
        }
      });
    }
  });
};

// --> /api/schedule

router.post("/", async (req, res) => {
  const schedule_task = new ScheduleTaskModel({
    activity: req.body.activity,
    date: req.body.date,
    crew: req.body.crew,
    vehicle: req.body.vehicle,
    pickups: req.body.pickups,
    details: req.body.details,
  });
  const meeting_points = req.body.pickups.map((pickup) => pickup.meeting_point);

  try {
    const save_task = await schedule_task.save();
    const save_meeting_points = await addToFrequentMeetingPoints(
      meeting_points
    );

    const notificationTokens =
      Object.values(save_task.crew).flat().length > 0 // array of crew members
        ? [
            ...new Set( // remove duplicates,Set class stores unique values
              Object.values(save_task.crew) // array of arrays --> each array is a crew group - drivers, escorts, guides
                .flat() // flatten array --> array of crew members
                .map((staffMember) => staffMember.loggedDevices) // array of arrays --> each array is a crew member's devices
                .flat() // flatten array --> array of devices
                .map((device) => device.token) // array of tokens
                .filter((token) => !token.includes("emulator")) // filter out emulator tokens
            ),
          ]
        : [];

    const firstPickupString = save_task.pickups[0]
      ? `First pickup: ${
          save_task.pickups[0].time
            ? moment(save_task.pickups[0].time)
                .tz("Europe/Athens")
                .format("HH:mm")
            : "Time not set"
        } @ ${save_task.pickups[0].meeting_point}`
      : "First pickup : pickups not set";

    const sendNotifications = await sendPushNotifications(notificationTokens, {
      title: "A new task is assigned to you !",
      body: `${moment(save_task.date).format("DD MMMM YYYY")} - ${
        save_task.activity.type
      } - ${firstPickupString} - Visit the app to see more details`,
    });

    Promise.all([save_task, save_meeting_points, sendNotifications]).then(
      (values) => {
        res.send("Schedule task has created succesfully");
      }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).send(error.message.toString());
    } else {
      res.status(400).send(error.toString());
    }
  }
});

// ---------------------- READ --------------------------------

// --> /api/schedule
router.get("/", (req, res) => {
  ScheduleTaskModel.find()
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});
// --> /api/schedule/id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  ScheduleTaskModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send(err));
});

// --> /api/schedule/pagination/:user_id
router.get("/pagination/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date, skip } = req.query;
  const hasDateQuery = start_date && end_date;

  const date_query = hasDateQuery
    ? {
        date: {
          $gte: start_date, //it comes as moment.utc().startOf("day") from frontend --> EXAMPLE --> START_2022-06-21T00:00:00.000Z - END_2022-06-23T23:59:59.999Z
          $lte: end_date, //it comes as moment.utc().endOf("day") from frontend --> EXAMPLE --> START_2022-06-21T00:00:00.000Z - END_2022-06-23T23:59:59.999Z
        },
      }
    : {};

  if (user_id === process.env.ADMIN_ID) {
    ScheduleTaskModel.find({ ...date_query })
      .skip(skip)
      .sort({ date: "desc" })
      .limit(8)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => res.status(400).send("ERROR"));
  } else {
    ScheduleTaskModel.find({
      ...date_query,
      $or: [
        {
          "crew.drivers": {
            $elemMatch: {
              _id: user_id,
            },
          },
        },
        {
          "crew.escorts": {
            $elemMatch: {
              _id: user_id,
            },
          },
        },
        {
          "crew.guides": {
            $elemMatch: {
              _id: user_id,
            },
          },
        },
      ],
    }) // TODO make it dynamic using aggregation,it will return the same even if properties are unknown --> https://stackoverflow.com/questions/72374047/mongoose-return-all-documents-that-contain-a-value-wherever-inside-a-property
      .skip(skip)
      .sort({ date: "desc" })
      .limit(8)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => res.send("ERROR"));
  }
});

// ---------------------- UPDATE -----------------------------------------------------------------------

// --> /api/schedule/toggle_status/:task_id/:user_id
router.put("/toggle_status/:task_id/:user_id", (req, res) => {
  const task_id = req.params.task_id;
  const user_id = req.params.user_id;

  ScheduleTaskModel.findById(task_id)
    .then((scheduleTask) => {
      const newCrew = _.cloneDeep(scheduleTask.crew);
      Object.keys(newCrew).forEach((key) => {
        newCrew[key].forEach((obj) => {
          if (obj._id === user_id) {
            obj.reported = !obj.reported;
          }
        });
      });
      scheduleTask.crew = newCrew;
      return scheduleTask.save();
    })
    .then((result) => {
      const isReportedString = Object.keys(result.crew)
        .map((i) => result.crew[i])
        .flat()
        .find((crewMember) => crewMember._id === user_id).reported
        ? "reported"
        : "assigned";

      res.send({
        document: result,
        msg: `Task report status is: ${isReportedString}`,
      });
      return result;
    })
    .then((scheduleTask) => {
      const crewMemberName = Object.keys(scheduleTask.crew)
        .map((i) => scheduleTask.crew[i])
        .flat()
        .find((crewMember) => crewMember._id === user_id).name;

      const crewYetToReport = Object.keys(scheduleTask.crew)
        .map((i) => scheduleTask.crew[i])
        .flat()
        .filter((crewMember) => crewMember.reported === false)
        .map((crewMember) => crewMember.name)
        .join(", ");

      UserModel.findById(process.env.ADMIN_ID).then((admin) => {
        let tokens = admin.loggedDevices.map((device) => device.token);
        sendPushNotifications(tokens, {
          title: `${crewMemberName} has reported back to the following task`,
          body: `${moment(scheduleTask.date).format("DD MMMM YYYY")} - ${
            scheduleTask.activity.type
          } - Crew yet to report back to this task: ${
            crewYetToReport ? crewYetToReport : "All crew have reported back"
          }`,
        });
      });
    })
    .catch((err) => res.send(err));
});

// --> /api/schedule/:id
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  ScheduleTaskModel.findById(id)
    .then((scheduleTask) => {
      scheduleTask.activity = req.body.activity;
      scheduleTask.date = req.body.date;
      scheduleTask.crew = req.body.crew;
      scheduleTask.vehicle = req.body.vehicle;
      scheduleTask.pickups = req.body.pickups;
      scheduleTask.details = req.body.details;

      return scheduleTask.save();
    })
    .then((scheduleObj) => {
      let notificationTokens =
        Object.values(scheduleObj.crew).reduce((acc, curr) => [...acc, ...curr]) // array of crew members
          .length > 0
          ? [
              ...new Set( // remove duplicates,Set class stores unique values
                Object.values(scheduleObj.crew) // array of arrays --> each array is a crew group - drivers, escorts, guides
                  .reduce((acc, curr) => [...acc, ...curr]) // flatten array --> array of crew members
                  .map((staffMember) => staffMember.loggedDevices) // array of arrays --> each array is a crew member's devices
                  .reduce((acc, curr) => [...acc, ...curr]) // flatten array --> array of devices
                  .map((device) => device.token) // array of tokens
                  .filter((token) => !token.includes("emulator")) // filter out emulator tokens
              ),
            ]
          : [];
      return {
        notificationTokens: notificationTokens,
        info: {
          date: moment(scheduleObj.date).format("DD MMMM YYYY"),
          activity: scheduleObj.activity.type,
          firstPickup: scheduleObj.pickups[0]
            ? `First pickup: ${
                scheduleObj.pickups[0].time
                  ? moment(scheduleObj.pickups[0].time)
                      .tz("Europe/Athens")
                      .format("HH:mm")
                  : "Time not set"
              } @ ${scheduleObj.pickups[0].meeting_point}`
            : "First pickup : pickups not set",
        },
      };
    })
    .then((notificationObj) => {
      sendPushNotifications(notificationObj.notificationTokens, {
        title: "A task assigned to you has updated !",
        body: `${notificationObj.info.date} - ${notificationObj.info.activity} - ${notificationObj.info.firstPickup} - Visit the app to see more details`,
      }).then(() => {
        res.send("Schedule task has updated succesfully");
      });
    })
    .catch((error) => {
      if (error.name === "ValidationError") {
        res.status(400).send(error.message.toString());
      } else {
        res.status(400).send(error.toString());
      }
    });
});

// ---------------------- DELETE ----------------------------------------------------------------------------

// --> /api/schedule/id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  ScheduleTaskModel.findByIdAndRemove(id)
    .then((scheduleObj) => {
      let notificationTokens =
        Object.values(scheduleObj.crew).reduce((acc, curr) => [...acc, ...curr]) // array of crew members
          .length > 0
          ? [
              ...new Set( // remove duplicates,Set class stores unique values
                Object.values(scheduleObj.crew) // array of arrays --> each array is a crew group - drivers, escorts, guides
                  .reduce((acc, curr) => [...acc, ...curr]) // flatten array --> array of crew members
                  .map((staffMember) => staffMember.loggedDevices) // array of arrays --> each array is a crew member's devices
                  .reduce((acc, curr) => [...acc, ...curr]) // flatten array --> array of devices
                  .map((device) => device.token) // array of tokens
                  .filter((token) => !token.includes("emulator")) // filter out emulator tokens
              ),
            ]
          : [];
      sendPushNotifications(notificationTokens, {
        title: "A task assigned to you has cancelled !",
        body: `${moment(scheduleObj.date).format("DD MMMM YYYY")} - ${
          scheduleObj.activity.type
        } - Visit the app to see more details`,
      }).then(() => {
        res.send("Schedule task has deleted succesfully");
      });
    })
    .catch((err) => res.send(err.toString()));
});

// --------------------------------------------------------------

module.exports = router;
