/**
 * @title Model Index
 * @description Central export file for all Mongoose database models (User, Photo, Album).
 * @module db/models/model_index
 */
// Index file for easy exports of database models
export { default as User } from "./user.mjs";
export { default as Photo } from "./photo.mjs";
export { default as Album } from "./album.mjs";