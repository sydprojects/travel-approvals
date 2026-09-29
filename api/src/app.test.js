const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("./app");

function newApp() {
  return createApp({ allowedOrigin: "http://localhost:3000" });
}

test("GET /requests returns items newest first", async () => {
  const res = await request(newApp()).get("/requests");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items));
  assert.equal(res.body.items.length, 3);
  const dates = res.body.items.map((i) => i.createdAt);
  const sorted = [...dates].sort().reverse();
  assert.deepEqual(dates, sorted);
});

test("GET /requests/:id returns 404 for unknown id", async () => {
  const res = await request(newApp()).get("/requests/999");
  assert.equal(res.status, 404);
  assert.ok(res.body.error);
});

test("GET /requests/:id returns the matching request", async () => {
  const res = await request(newApp()).get("/requests/1");
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 1);
});

test("POST /requests rejects a title-less payload with a 400", async () => {
  const res = await request(newApp()).post("/requests").send({});
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test("POST /requests rejects startDate after endDate", async () => {
  const res = await request(newApp()).post("/requests").send({
    requesterName: "Jamie Lee",
    destination: "Lima, PE",
    startDate: "2026-12-10",
    endDate: "2026-12-01",
    reason: "Annual supplier review meeting on site.",
  });
  assert.equal(res.status, 400);
});

test("POST /requests creates a pending request with valid input", async () => {
  const res = await request(newApp()).post("/requests").send({
    requesterName: "Jamie Lee",
    destination: "Lima, PE",
    startDate: "2026-12-01",
    endDate: "2026-12-05",
    reason: "Annual supplier review meeting on site.",
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, "pending");
  assert.equal(res.body.requesterName, "Jamie Lee");
});

test("PATCH /requests/:id approves a pending request", async () => {
  const app = newApp();
  const res = await request(app).patch("/requests/1").send({ status: "approved" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "approved");
});

test("PATCH /requests/:id rejects changing an already-decided request (terminal state)", async () => {
  const app = newApp();
  // request 2 is seeded as already approved
  const res = await request(app).patch("/requests/2").send({ status: "rejected" });
  assert.equal(res.status, 409);
});

test("PATCH /requests/:id rejects an invalid status value", async () => {
  const res = await request(newApp()).patch("/requests/1").send({ status: "archived" });
  assert.equal(res.status, 400);
});

test("PATCH /requests/:id returns 404 for unknown id", async () => {
  const res = await request(newApp()).patch("/requests/999").send({ status: "approved" });
  assert.equal(res.status, 404);
});
