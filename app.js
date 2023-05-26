const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
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

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT * 
      FROM todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status='${status}'
        AND priority='${priority}'`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT * 
      FROM todo
      WHERE
        todo LIKE '%${search_q}%'
        AND priority='${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT * 
      FROM todo
      WHERE
        todo LIKE '%${search_q}%'
        AND status='${status}'`;
      break;
    default:
      getTodosQuery = `
        SELECt * FROM todo
        WHERE
        todo LIKE '${search_q}'`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM
    todo
    WHERE
    id=${todoId};`;
  const dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});

//API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO
    todo(id,todo,priority,status)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
         );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT * 
    FROM
     todo 
    WHERE 
     id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo
    SET
        todo=${todo},
        priority='${priority}',
        status='${status}'
    WHERE
    id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE
    FROM
    todo
    WHERE
    id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
