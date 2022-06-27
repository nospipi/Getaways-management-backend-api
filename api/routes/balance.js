const express = require("express");
const router = express.Router();
const { BalanceModel } = require("../../models/models");

// ---------------------- CREATE -------------------------------

// --> /api/balance

router.post("/", (req, res) => {
  const balance = new BalanceModel({
    user: {
      name: req.body.name,
      id: req.body.id,
    },
    date: req.body.date,
    description: req.body.description,
    amount: req.body.amount,
    type: req.body.type,
  });

  balance
    .save()
    .then(async (response) => {
      res.send({
        ...response,
        message: "Balance transaction has saved succesfully",
      });
    })
    .catch((error) => {
      if (error.name === "ValidationError") {
        // let errors = {};
        // Object.keys(error.errors).forEach((key) => {
        //   errors[key] = error.errors[key].message;
        // });
        res.status(400).send(error.message);
      } else {
        res.status(400).send(error);
      }
    });
});

// ---------------------- READ -------------------------------

// --> /api/balance/total/:user_id
router.get("/total/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  balance = await BalanceModel.find(
    user_id === process.env.ADMIN_ID ? null : { "user.id": user_id } //we pass a query if user_id param is not admin's otherwise return all
  )
    .then((data) => {
      res.send({
        expensesTotal: data
          .filter((transaction) => transaction.type === "expense")
          .reduce((total, transaction) => total + transaction.amount, 0), //reduce starts counting at zero as initial value,so if filtered array comes out empty then it will return 0
        incomeTotal: data
          .filter((transaction) => transaction.type === "income")
          .reduce((total, transaction) => total + transaction.amount, 0),
      });
    })
    .catch((err) => res.status(400).send("ERROR " + err));
});
// --> /api/balance/pagination/:user_id/:skip
router.get("/pagination/:user_id/:skip", async (req, res) => {
  const user_id = req.params.user_id;
  const skip = req.params.skip;

  if (user_id === process.env.ADMIN_ID) {
    BalanceModel.find()
      .skip(skip)
      .sort({ _id: -1 })
      .limit(8)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => res.status(400).send("ERROR"));
  } else {
    BalanceModel.find({ "user.id": user_id })
      .skip(skip)
      .sort({ _id: -1 })
      .limit(8)
      .then((data) => res.send(data))
      .catch((err) => res.send("ERROR"));
  }
});

// --> /api/balance/:id
router.get("/:id", (req, res) => {
  const id = req.params.id;

  BalanceModel.findById(id)
    .then((data) => res.send(data))
    .catch((err) => res.send("Transaction not found"));
});

// ---------------------- UPDATE --------------------------------

// --> /api/balance/:id
router.put("/:id", (req, res) => {
  const id = req.params.id;

  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(422).json({ errors: errors.array() });
  // }

  BalanceModel.findById(id)
    .then((balanceEntry) => {
      balanceEntry.user = req.body.user;
      balanceEntry.date.day = req.body.date.day;
      balanceEntry.date.month = req.body.date.month;
      balanceEntry.date.year = req.body.date.year;
      balanceEntry.description = req.body.description;
      balanceEntry.amount = req.body.amount;
      balanceEntry.type = req.body.type;
      balanceEntry.receipt = req.body.receipt;

      return balanceEntry.save();
    })
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

// --> /api/balance/set_receipt_url/:id
router.put("/set_receipt_url/:id", (req, res) => {
  const id = req.params.id;

  BalanceModel.findById(id)
    .then((balanceEntry) => {
      balanceEntry.receiptUrl = req.body.receiptUrl;
      return balanceEntry.save();
    })
    .then((result) => res.send("Balance transaction has saved succesfully"))
    .catch((err) => res.send(err));
});

// ---------------------- DELETE --------------------------------

// --> /api/balance/id
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  BalanceModel.findByIdAndRemove(id)
    .then((data) => res.send("Transaction has deleted succesfully"))
    .catch((err) => res.send(err));
});

// --------------------------------------------------------------

module.exports = router;
