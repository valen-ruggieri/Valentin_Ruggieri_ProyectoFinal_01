const express = require("express");
const routerProducts = express.Router();
const path = require("path");
const multer = require("multer");
const logger = require("../../utils/logger");
const database = require("../../firebase/firebase");
const config = require("../../utils/config");

const {
  userPermissionsClient,
  userPermissionsAdmin,
} = require("../../utils/permissions");
const { Data } = require("../RouterUser/routerUser");
const validation = require("../../utils/Middlewares/validationMiddleware");
const productSchema = require("../../Validations/productValidation");
const validationProduct = require("../../utils/Middlewares/validationProduct");

routerProducts.use(express.static(path.join(__dirname + "/public")));
routerProducts.use(express.static("public"));
routerProducts.use(express.static("views"));
routerProducts.use(express.static("partials"));




const uID = Data;

//>|  multer config

const storageContent = multer.diskStorage({
  destination: path.join(__dirname + "/public/images"),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

routerProducts.use(
  multer({
    storage: storageContent,
    limits: { fileSize: 1000000 },
    dest: path.join(__dirname + "/public/images"),
  }).single("image")
);

// $                   CLIENTE

// $   Puede ver y agregar productos al carrito como asi tambien logearse

// >| get productos
routerProducts.get("/productos/tienda", async (req, res) => {
  if (!userPermissionsClient(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  const querySnapshot = await database.collection("Productos").get();
  const productos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    img: doc.data().img,
    titulo: doc.data().titulo,
    precio: doc.data().precioFormat,
    timestamp: doc.data().timestamp,
    descripcion: doc.data().descripcion,
    codigo: doc.data().codigo,
    producto: ` ${doc.data().titulo}, ${doc.data().precioFormat}`,
    // ` ${doc.data().img},${ doc.data().titulo},${doc.data().precioFormat},${doc.data().timestamp},${doc.data().descripcion},${doc.data().codigo}`
  }));
  res.render("productosClientes.ejs", { productos , uID});
});

// >| get id productos

routerProducts.get("/productos/producto/:id", async (req, res) => {
  if (!userPermissionsClient(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }
  const productoFR = await database
    .collection("Productos")
    .doc(req.params.id)
    .get();
  const producto = {
    id: productoFR.id,
    titulo: productoFR.data().titulo,
    precio: productoFR.data().precioFormat,
    img: productoFR.data().img,
    titulo: productoFR.data().titulo,
    timestamp: productoFR.data().timestamp,
    descripcion: productoFR.data().descripcion,
    codigo: productoFR.data().codigo,
  };
  res.render("productoid.ejs", { producto,uID });
});



//%                   ADMINISTRADOR

//%     Puede agregar, editar y borrar productos como asi tambien logearse

// >| get productos
routerProducts.get("/productos/all", async (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  const querySnapshot = await database.collection("Productos").get();
  const productos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    img: doc.data().img,
    titulo: doc.data().titulo,
    precio: doc.data().precioFormat,
    timestamp: doc.data().timestamp,
    descripcion: doc.data().descripcion,
    codigo: doc.data().codigo,
  }));
  res.render("productosAdmin.ejs", { productos, uID });
});

// >| delete producto

routerProducts.get("/productos/delete/:id", async (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  await database.collection("Productos").doc(req.params.id).delete();
  res.redirect("/api/productos/all");
});



// >| ruta post de productos

routerProducts.post("/productos/form", validationProduct(productSchema),async (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  const { titulo, precio, descripcion, codigo} = req.body;

  const img = req.file.filename

  const precioFormat = Number(precio);
  const date = new Date();
  const timestamp = ` ${date.getDay()}/ ${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}: ${date.getMinutes()}: ${date.getSeconds()}`;

  await database
    .collection("Productos")
    .add({ titulo, precioFormat, timestamp, descripcion, codigo, img });
  res.redirect("/api/productos/all");
});

routerProducts.get("/productos/form", (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  res.render("formAdd.ejs");
});

//>| ruta post de actualizacion de productos


routerProducts.post("/productos/update/:id",validationProduct(productSchema), async (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {
    return res.redirect("/errorRoute");
  }

  const { titulo, precio, descripcion, codigo } = req.body;
  const img =  req.file.filename 
  const precioFormat = Number(precio);
  const date = new Date();
  const timestamp = ` ${date.getDay()}/ ${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}: ${date.getMinutes()}: ${date.getSeconds()}`;
  await database
    .collection("Productos")
    .doc(req.params.id)
    .update({ titulo, precioFormat, timestamp, descripcion, codigo, img });

  res.redirect("/api/productos/all");
});


routerProducts.get("/productos/update/:id", (req, res) => {
  if (!userPermissionsAdmin(uID.userPermission)) {return res.redirect("/errorRoute");}
  res.render("formUpdate.ejs");
});


module.exports = routerProducts;
