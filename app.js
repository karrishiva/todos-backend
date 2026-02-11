const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPrioritiesAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasPrioritiesAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE priority='${priority}' AND status='${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE status='${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id=${todoId};`;

  const getTodoId = await db.get(getTodoQuery);

  response.send(getTodoId);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const addNewTodo = `INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`;

  await db.run(addNewTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;

  let updatedColumn = null;
  let getUpdatedQuery = null;

  switch (true) {
    case status !== undefined:
      updatedColumn = "Status";
      getUpdatedQuery = `UPDATE todo SET status = '${status}'
      WHERE id=${todoId};`;
      break;

    case priority !== undefined:
      updatedColumn = "Priority";
      getUpdatedQuery = `UPDATE todo SET priority = '${priority}'
      WHERE id=${todoId};`;
      break;
    case todo !== undefined:
      updatedColumn = "Todo";
      getUpdatedQuery = `UPDATE todo SET todo = '${todo}'
      WHERE id=${todoId};`;
      break;
  }

  await db.run(getUpdatedQuery);

  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
