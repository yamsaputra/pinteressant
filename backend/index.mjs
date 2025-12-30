export class backendRoutes {
  constructor(app) {
    this.app = app;
  }

  setupRoutes() {
    this.app.get("/status", (req, res) => {
      console.log("Status route accessed.");
      res.json({ message: "Backend is running", status : 200 });
    });
  }
}