const express = require("express");

const database = require("../../firebase/firebase");
const routerUser = express.Router();
const path = require("path");
const logger = require("../../utils/logger");
const validation = require("../../utils/Middlewares/validationMiddleware");
const userschema = require("../../Validations/userValidation");




routerUser.use(express.static(path.join(__dirname + "/public")));

let Data = { id: "" };

const userSession = async (email, password) => {
  const user = await database
    .collection("Users")
    .where("password", "==", password)
    .where("email", "==", email)
    .get();
  const dataRef = user.docs.map((user) => ({
    id: user.id,
    userName: user.data().name,
    password: user.data().password,
    userPermission: user.data().userType,
  }));

  return dataRef[0];
};
routerUser.get("/user", (req, res) => {
  res.render("user.ejs");
});



routerUser.post("/user",validation(userschema), async (req, res) => {
  const { name, email, password, userType } = req.body;


  await database
    .collection("Users")
    .add({ name, email, password, userType});

  const { id, userPermission , userName} = await userSession(email, password);
  Data.id = id;
  Data.userPermission = userPermission;
  Data.userName = userName;
  logger.info('Sesion de '+Data.userPermission+' Iniciada - uID:'+Data.id)
  if (userType === "cliente") {
    return res.redirect("/api/productos/tienda");
  } else {
    return res.redirect("/api/productos/all");
  }
});

module.exports = { routerUser, Data };
