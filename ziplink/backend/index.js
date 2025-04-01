const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let expenses = [];

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  // Send existing expenses to newly connected client
  socket.emit("load-expenses", expenses);
  
  socket.on("user-message", (message) => {
    console.log(`Received message: ${message}`);
    
    try {
      // Parse the expense data
      const expense = JSON.parse(message);
      
      // Check if the expense already exists
      const existingIndex = expenses.findIndex(e => e.id === expense.id);
      
      if (existingIndex !== -1) {
        // Update existing expense
        expenses[existingIndex] = expense;
        console.log(`Updated expense: Title - ${expense.title} ID - ${expense.id}`);
      } else {
        // Add new expense
        expenses.push(expense);
        console.log(`Added new expense: Title - ${expense.title} ID - ${expense.id}`);
      }
      
      // Broadcast to all clients
      io.emit("message", message);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // socket.on("update-status", (data) => {
  //   console.log(`Received status update: ${JSON.stringify(data)}`);
    
  //   // Find and update the expense
  //   const expense = expenses.find(e => e.id === data.id);
  //   if (expense) {
  //     expense.status = data.status || "Paid";
  //     console.log(`Updated status for Title - ${expense.title} ID - ${expense.id} to ${expense.status}`);
  //   }
    
  //   // Broadcast the update to all connected clients
  //   io.emit('status-updated', data);
  // });

//   socket.on("update-status", (data) => {
//     console.log(`Received status update: ${JSON.stringify(data)}`);
    
//     // Find and update the expense
//     const expense = expenses.find(e => e.id === data.id);
//     if (expense) {
//         expense.status = data.status || "Paid";
//         expense.note = data.note || "";  // Store the note

//         console.log(`Updated status for Title - ${expense.title} ID - ${expense.id} to ${expense.status} with Note - ${expense.note}`);
//     }
    
//     // Broadcast the update to all connected clients
//     io.emit('status-updated', data);
// });


  socket.on("update-status", (data) => {
      console.log(`Received update: ${JSON.stringify(data)}`);
      const expense = expenses.find(e => e.id === data.id);
      if (expense) {
          expense.status = data.status;
          expense.note = data.note;
          if(data.paidDate != undefined){
          expense.paidDate = data.paidDate;
          }
          if (data.amount !== undefined) {
              expense.amount = data.amount;
          }
          console.log(`Updated Expense: ${JSON.stringify(expense)}`);
      }
      io.emit('status-updated', data);
  });

  socket.on("update-expense-approved", (data) => {
      console.log(`Received Approved: ${JSON.stringify(data)}`);
      const expense = expenses.find(e => e.id === data.id);
      if (expense) {
          expense.isApproved = data.isApproved;
          console.log(`Approved Expense: ${JSON.stringify(expense)}`);
      }
      io.emit('approved-updated', data);
  });

  socket.on("delete-expense", (id) => {
    console.log(`Request to delete expense: ${id}`);
    
    expenseToDelete = expenses.find( e => e.id === id);
    // Find and remove the expense
    const initialLength = expenses.length;
    expenses = expenses.filter(e => e.id !== id);
    
    if (expenses.length < initialLength) {
      console.log(`Deleted expense: ${expenseToDelete?.title || 'Unknown'} (ID: ${id})`);
      io.emit('expense-deleted', id);
    } else {
      console.log(`Expense ID - ${id} not found`)
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
